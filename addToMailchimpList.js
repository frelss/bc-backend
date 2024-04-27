const axios = require("axios");

const addToMailchimpList = async (email) => {
  const data = {
    members: [
      {
        email_address: email,
        status: "subscribed",
      },
    ],
    update_existing: true,
  };

  const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
  const MAILCHIMP_AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;
  const DATACENTER = MAILCHIMP_API_KEY.split("-")[1];

  const url = `https://${DATACENTER}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}`;

  const options = {
    headers: {
      Authorization: `apikey ${MAILCHIMP_API_KEY}`,
      "Content-Type": "application/json",
    },
  };

  try {
    const response = await axios.post(url, data, options);
    return { success: true, alreadySubscribed: false };
  } catch (error) {
    if (
      error.response &&
      error.response.data &&
      error.response.data.title === "Member Exists"
    ) {
      return { success: true, alreadySubscribed: true };
    }
    console.error(
      "Error adding to Mailchimp list:",
      error.response ? error.response.data : error
    );
    throw new Error("Failed to subscribe.");
  }
};

module.exports = addToMailchimpList;
