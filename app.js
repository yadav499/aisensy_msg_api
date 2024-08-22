const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const businessdatabase = require("./models/businessModel");
const Project = require("./models/projectModel");
const ApiKey = require("./models/apiModel");
const authenticateApiKey = require('./middleware/authMiddleware');
const app = express();

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log("Database connected");
}).catch((err) => {
    console.log("Database not connected",err);
});

const partner_id = process.env.partner_id;
const apiKey = process.env.apiKey;

function validateAndFormatWaNumber(number) {
    let digitsOnly = number.replace(/\D/g, '');
    if (digitsOnly.length === 10) {
        return '91' + digitsOnly;
    }
    if (digitsOnly.length === 12 && digitsOnly.substring(0, 2) === '91') {
        return digitsOnly;
    }
    return null;
}

app.use(express.json()); // To parse JSON bodies

app.get("/fetchandstorebusiness", authenticateApiKey, async (req, res) => {
    try {
        const url = `https://apis.aisensy.com/partner-apis/v1/partner/${partner_id}/business`;
        const response = await axios.get(url, {
            headers: {
                'Accept': 'application/json',
                'X-AiSensy-Partner-API-Key': apiKey
            }
        });
        const businessdata = response.data;
        for (const businessresponse of businessdata) {
            const business = new businessdatabase(businessresponse);
            await business.save();
        }
        return res.status(200).send({ success: true });
    } catch (error) {
        console.error("Error fetching business data:", error);
        return res.status(500).send({ success: false, message: 'Error fetching business data' });
    }
});

app.get("/fetchandstoreprojects", authenticateApiKey, async (req, res) => {
    try {
        const allBusinessIds = await businessdatabase.find({}, 'business_id');
        const businessIds = allBusinessIds.map(b => b.business_id);

        for (const businessId of businessIds) {
            try {
                const url = `https://apis.aisensy.com/partner-apis/v1/partner/${partner_id}/business/${businessId}/project`;
                const response = await axios.get(url, {
                    headers: {
                        'Accept': 'application/json',
                        'X-AiSensy-Partner-API-Key': apiKey
                    }
                });

                const projectData = response.data.projects;
                for (const project of projectData) {
                    const newProject = new Project(project);
                    await newProject.save();
                }
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    console.log(`Projects not found for business ID: ${businessId}`);
                    continue;
                } else {
                    throw error;
                }
            }
        }

        res.status(200).send({ success: true, message: 'Projects fetched and stored successfully' });
    } catch (error) {
        console.error("Error fetching projects data:", error);
        res.status(500).send({ success: false, message: 'Error fetching projects data', error: error.message });
    }
});

app.get("/projects-by-wa-number/:wa_number", authenticateApiKey, async (req, res) => {
    try {
        let { wa_number } = req.params;
        wa_number = validateAndFormatWaNumber(wa_number);
        const projects = await Project.find({ wa_number: wa_number }, 'id business_id');

        if (projects.length === 0) {
            return res.status(404).send({ success: false, message: `No projects found for wa_number ${wa_number}` });
        }

        const projectIds = projects.map(p => p.id);
        const businessIds = projects.map(p => p.business_id);

        return res.status(200).send({ success: true, projectIds: projectIds, businessIds: businessIds });
    } catch (error) {
        console.error("Error fetching project_ids:", error);
        return res.status(500).send({ success: false, message: 'Error fetching project_ids', error: error.message });
    }
});


//webhook

// app.post('/businesswebhook', async (req, res) => {
//     const {
//       business_id,
//       active,
//       display_name,
//       project_ids,
//       user_name,
//       email,
//       created_at,
//       updated_at,
//       company,
//       contact,
//       currency,
//       timezone,
//       partner_id,
//       type,
//       createdOn,
//       companySize,
//       password,
//     } = req.body;
  
//     try {
//       const newBusiness = new businessdatabase({
//         business_id,
//         active,
//         display_name,
//         project_ids,
//         user_name,
//         email,
//         // created_at,
//         // updated_at,
//         company,
//         contact,
//         currency,
//         timezone,
//         partner_id,
//         type,
//         // createdOn,
//         companySize,
//         password
//       });
  
//      const response = await newBusiness.save();

//      const newbusinessIds = response.data.business_id;

  
//       res.status(201).json({sucess:true, message: 'Business data saved successfully',newbusinessIds });
//     } catch (error) {
//       res.status(500).json({sucesss:false, error: 'Failed to save business data' });
//     }
//   });

const saveBusinessAndFetchProjects = async (businessData) => {
    const newBusiness = new businessdatabase(businessData);
    const savedBusiness = await newBusiness.save();
    const businessId = savedBusiness.business_id;
    const partnerId = process.env.partner_id;
  
    try {
      const url = `https://apis.aisensy.com/partner-apis/v1/partner/${partnerId}/business/${businessId}/project`;
      const response = await axios.get(url, {
        headers: {
          'Accept': 'application/json',
          'X-AiSensy-Partner-API-Key': process.env.apiKey,
        },
      });
  
      const projectData = response.data.projects;
      for (const project of projectData) {
        const newProject = new Project(project);
        await newProject.save();
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log(`Projects not found for business ID: ${businessId}`);
      } else {
        throw error;
      }
    }
  };
  
  // Webhook endpoint
  app.post('/businesswebhook', async (req, res) => {
    const data = req.body;
  
    try {
      if (Array.isArray(data)) {
        // If data is an array, process each entry
        for (const businessData of data) {
          await saveBusinessAndFetchProjects(businessData);
        }
      } else {
        // If data is a single object, process it directly
        await saveBusinessAndFetchProjects(data);
      }
  
      res.status(201).json({ message: 'Business data and projects saved successfully' });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ error: 'Failed to process webhook data' });
    }
  });
  

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});
