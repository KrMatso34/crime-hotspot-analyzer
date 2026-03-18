# KAGS Crime Hotspot Analyzer and Safety Router

KAGS is an app with the focus of improving public safety by displaying high risk areas and providing safe routing and navigation to avoid dangerous places.

## Table of Contents
- [Introduction](#introduction)
- [Features](#features)
- [Design Details](#design-details)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Introduction

Other navigation apps take speed as the top-most user priority, which may encourage citizens to travel through unsafe areas in order to minimize distance by all means necessary. This puts significant risk into the experience of navigation, which our app helps to minimize. KAGS uses route optimization and user preferences to craft the perfect route between any two addresses that both minimizes time and avoids risky or dangerous areas to walk or drive through.

## Features

Map of Washington roads and cities
Specify addresses for route origin, destination, and up to 5 additional stops
Construct multiple routes with different priorities between safest and quickest
Live heat map displaying hot spots of high risk areas
Personalized toggles to specify user preference of what crime data to take into account
Live crime alerts messages to display most recent Seattle crime incidents

## Design Details

API fetching and data collection
Python scripts continuously collect data from public city datasets to find the most recent and relevant crime incidents data
All relevant data points are filtered out
Data is normalized and refined to match each other and work cohesively with each other

Database storage
Our data is hosted in DynamoDB on the cloud to provide a safe storage
AWS data is continuously reevaluated to make sure it stays relevant and fresh, otherwise it will flush the unnecessary data out

Data usage and visualization
Using the data live from the database, the front end uses Leaflet to render out a map and display all of the data as a heatmap over the Bellevue and Seattle area
Each crime incident point can be manually filtered out by the user live if they prefer to disregard certain incident types, severities, or time ranges

Navigation
Using GraphHopper, the server takes the live heatmap data and reweights a city graph’s edges to strengthen or weaken certain roads based on their risk levels of passing through
Multiple routes are tested with different priorities between fastest, balanced, and safest to give back to the user flexible options on exactly how they want their route, and allow them to compare the options easily

# Installation steps

$ git clone https://github.com/KrMatso34/crime-hotspot-analyzer
$ cd crime-hotspot-analyzer

# Configuration

N/A

# Usage

Run javascript backend: 
cd ./safety-router-app/server
node server/index.js

Run java backend: 
cd ./dynamic-router-server
run through main

Run frontend: 
cd ./safety-router-app
npm run dev

# Contributing
For all external contributions, please fork the repository and submit your own pull requests or bug reports

# License
MIT License
