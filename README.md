# UK Tick Tracker 🐜

### Elanco Frontend Developer Assessment

**Created by:** Devi Sai Vara Prasad

## About the Project

I built this project as part of the Elanco Frontend Developer assessment.

The idea behind it is to make it easier to explore tick sightings across the UK. I wanted to create a simple dashboard where users can view sightings on a map, check information about different species and understand when and where sightings have been recorded.

The application uses data from the Elanco API and presents it through an interactive map and dashboard.

## What can you do with it?

- **Explore the map:** View tick sightings across different locations in the UK and click markers to see more information.
- **Search and filter:** Find sightings using the search bar and filters for species, severity and date.
- **View sighting details:** Check the location, species, date and other available information.
- **Check the timeline:** See recent sightings in date order.
- **Explore seasonal activity:** View a chart showing sightings by month and filter it by city or year.
- **Learn about ticks:** Read about tick species and some basic prevention tips.
- **Report a sighting:** Submit a report with the location, date, time, species, description and an optional photograph.
- **Share and get directions:** Share sighting information or open the location in Google Maps.

## Technologies I Used

- React – building the user interface.
- JavaScript – application functionality.
- Vite – running the development environment.
- React Leaflet and Leaflet – displaying the interactive map.
- Chart.js – creating the seasonal activity chart.
- Lucide React – icons.
- CSS – styling and layout.
- Elanco API – retrieving tick sighting records.

## Getting Started

If you want to run this project on your computer, follow these steps.

**Requirements:** Node.js, npm and Git.

**1. Clone the repository**

```bash
git clone https://github.com/sainaidumay/elanco-uk-tick-tracker.git
```

**2. Open the project folder**

```bash
cd elanco-uk-tick-tracker
```

**3. Install the required packages**

```bash
npm install
```

**4. Start the application**

```bash
npm run dev
```

**5. Open the local address**

Vite will display a local URL in the terminal. Open that address in your browser to use the application.

## A Few Things Worth Mentioning

While building this project, I worked with the data available from the Elanco API.

There are a few limitations in the available data:

- The API provides city names rather than exact sighting coordinates, so the map uses approximate city-centre locations where a match is available.
- Severity ratings are not provided for API records.
- Reports submitted through the form are saved in the browser's local storage.
- Uploaded photographs are selected locally and are not sent to a server.

## Author

**Devi Sai Vara Prasad kota**

Built as part of the Elanco Frontend Developer assessment.