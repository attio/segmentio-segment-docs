const axios = require('axios');
const path = require('path');
const fs = require('fs');
const fm = require('front-matter');
const yaml = require('js-yaml');
const {
  prompt
} = require('enquirer');

require('dotenv').config();


// Here, global variables are set
const PAPI_URL = "https://api.segmentapis.com"

const PRIVATE_DESTINATIONS = yaml.load(fs.readFileSync(path.resolve(__dirname, `../src/_data/catalog/destinations_private.yml`)))
const privateDests = PRIVATE_DESTINATIONS.items
const getCatalog = async (url, page_token = "MA==") => {
  try {
    const res = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PAPI_TOKEN}`
      },
      data: {
        "pagination": {
          "count": 200,
          "cursor": page_token
        }
      }
    });

    return res.data
  } catch (error) {
    console.log(error)
  }
}

const addPrivateDestination = async () => {
  const DEST_ID = await prompt({
    type: 'input',
    name: 'id',
    message: 'Enter the destination ID'
  })

  const privateIds = []
  for (let [key] of Object.entries(privateDests)) {
    privateIds.push(privateDests[key].id)
  }

  if (privateIds.includes(DEST_ID.id)) {
    console.log("This destination is already captured.")
    return
  } else {
    const res = await getCatalog(`${PAPI_URL}/catalog/destinations/${DEST_ID.id}`)
    destination = res.data.destinationMetadata
    let settings = destination.options

    settings.sort((a, b) => {
      if (a.name.toLowerCase() < b.name.toLowerCase()) {
        return -1;
      }
      if (a.name.toLowerCase() > b.name.toLowerCase()) {
        return 1;
      }
      return 0;
    })
    let actions = destination.actions
    let presets = destination.presets

    if (destination.status == "PRIVATE_BETA" || destination.status == "PRIVATE_BUILDING") {

      let updatePrivateDest = {
        id: destination.id,
        display_name: destination.name,
        name: destination.name,
        slug: destination.slug,
        previous_names: destination.previousNames,
        website: destination.website,
        status: destination.status,
        logo: {
          url: destination.logos.default
        },
        mark: {
          url: destination.logos.mark
        },
        methods: destination.supportedMethods,
        platforms: destination.supportedPlatforms,
        components: destination.components,
        browserUnbundlingSupported: destination.supportedFeatures.browserUnbundling,
        browserUnbundlingPublic: destination.supportedFeatures.browserUnbundlingPublic,
        replay: destination.supportedFeatures.replay,
        settings,
        actions,
        presets
      }

      privateDests.push(updatePrivateDest)
      const options = {
        noArrayIndent: false
      }

      output = "# AUTOGENERATED FROM PUBLIC API. DO NOT EDIT\n"
      var todayDate = new Date().toISOString().slice(0, 10);
      output += "# destination data last updated " + todayDate + " with " + destination.name + " \n";
      output += yaml.dump({
        items: privateDests
      }, options)
      //console.log(output)
      fs.writeFileSync(path.resolve(__dirname, `../src/_data/catalog/destinations_private.yml`), output);
    } else {
      console.log("This destination is already public")
    }
  }

}


addPrivateDestination()
