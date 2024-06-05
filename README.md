# PHMN_stats

## Install it

```sh
yarn install
```
## Build it

```sh
yarn build
```
## Create .env & set config

See .env.example for create .env

G_SHEETS_CREDS

Copy JSON string for a Google Service Account Here
Create a new service account from [This Link](https://console.cloud.google.com/projectselector2/iam-admin/serviceaccounts?_ga=2.184919274.-272657095.1578084478&supportedpurview=project)
Download a JSON credentials object for the service account. Give that account access to the sheets API. Share your sheet with the email address of the service account

G_SHEETS_ID

The sheet ID can be found in the URL of your google sheet, for example in https://docs.google.com/spreadsheets/d/1UuVIH2O38XK0TfPMGHk0HG_ixGLtLk6WoBKh4YSrDm4/edit#gid=0 The ID would be 1UuVIH2O38XK0TfPMGHk0HG_ixGLtLk6WoBKh4YSrDm4

## Run it

```sh
yarn start
```