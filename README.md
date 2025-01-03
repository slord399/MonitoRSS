# MonitoRSS (formerly Discord.RSS)

Delivers highly-customized news feeds to Discord!

- [MonitoRSS (formerly Discord.RSS)](#monitorss-formerly-discordrss)
  - [Get Started](#get-started)
    - [Self Host](#self-host)
      - [Customize Site Domain](#customize-site-domain)
      - [Install Portainer (Optional)](#install-portainer)
      - [Enable Email Notifications](#enable-email-notifications)
      - [Enable Reddit Authorizations](#enable-reddit-authorizations)
      - [Updating](#updating)
  - [Migrating from v6](#migrating-from-v6)


## Get Started
### Self Host

Docker is required to easily coordinate and run multiple services at once.

> [!NOTE]  
>  General knowledge of how Docker, Docker volumes, and docker compose works is highly recommended to avoid accidental data loss

1. Setup Docket apt repo
```
# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
```
2. Install Docker
```
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```
3. Clone this repo's `dev2` (the default) branch
```
git clone -b dev2 https://github.com/slord399/MonitoRSS.git
```
4. Create a Discord application through [Discord's developer portal](https://discord.com/developers/applications).
    1. Select `Scope (bot) / Bot Permissions (Manage Webhooks, View Channels, Send Messages, Embed Links)` on OAuth2 page.
    2. Invite bot using Generated URL at bottom of page.
5. Create a copy of the existing `.env.example` file and rename it to `.env.prod`
6. Replace all relevant values in the `.env.prod` file with your own values
   1. If you have your own MongoDB instance, set `BACKEND_API_MONGODB_URI` to your MongoDB URI
   2. Replace all `4` instances of "BOT_TOKEN_HERE" with your Discord bot application token
   3. Replace all `3` instances of "BOT_CLIENT_ID_HERE" with your Discord bot application ID
   4. Replace all `1` instances of "BOT_CLIENT_SECRET_HERE" with your Discord bot application secret
   5. Set `BACKEND_API_SESSION_SECRET` to a random 64-character string with alphabet/number, no symbol.
   6.  Set `BACKEND_API_SESSION_SALT` to a random 16-character string with alphabet/number, no symbol.
   7.  Add `http://localhost:8000/api/v1/discord/callback-v2` to the list of redirect URIs in your Discord application in the OAuth2 page
7.  Run `docker compose up -d`
    -  If you run into issues with network timeouts, pass the parallel flag to only build 1 container at once: `docker compose --parallel 1 up -d`
    -  Any containers ending in `-migration` do not need to be running
8.  Access the control panel via http://localhost:8000

#### Customize Site Domain

1. Set up your domain to point to the server running the control panel on localhost
2. Update all references to `http://localhost:8000` in your `.env.prod` to your desired domain. For example, `https://mynewdomain.com`.
3. Add `{DOMAIN_HERE}/api/v1/discord/callback-v2` to the list of redirect URIs in your Discord application in the OAuth2 page, replacing `{DOMAIN_HERE}` with the value you set in step 1

#### Install Portainer
For Docker Container Management (Optional)
1. Run
```
docker volume create portainer_data
```
2. Run
```
docker run -d -p 8500:8500 -p 9443:9443 --name portainer --restart=always -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer-ce:2.21.5
```
3. Portainer v2.21.5 been installed which is current LTS build of Portainer.


#### Enable Email Notifications

While email notifications are available so that you may get notified when feeds are disabled for various reasons (permission erorrs, request errors, etc), credentials must be set to be able to send them out. Set the three variables below with your email provider's SMTP settings in your env file:

- `BACKEND_API_SMTP_HOST`
- `BACKEND_API_SMTP_USERNAME`
- `BACKEND_API_SMTP_PASSWORD`
- `BACKEND_API_SMTP_FROM`

Make sure to opt into email notifications in the control panel's user settings page afterwards.

#### Enable Reddit Authorizations

1. Create a Reddit application at https://www.reddit.com/prefs/apps as a "web app".
2. Add `{DOMAIN_HERE}/api/v1/reddit/callback` to the list of redirect URIs in your Reddit application settings, replacing `{DOMAIN_HERE}` with your domain that you're using to access the control panel.
3. Copy the redirect URI you just added and set it as `BACKEND_API_REDDIT_REDIRECT_URI` in your `.env.prod` file.
4. Copy the Reddit application's client ID (under "web app" label) and set it as `BACKEND_API_REDDIT_CLIENT_ID` in your `.env.prod` file.
5. Copy the Reddit application's secret and set it as `BACKEND_API_REDDIT_CLIENT_SECRET` in your `.env.prod` file.
6. Generate a random 64-digit hexadecimal string and set it as `BACKEND_API_ENCRYPTION_KEY_HEX` in your `.env.prod` file. One option is to use an online generator such as [this one](https://www.browserling.com/tools/random-hex).


#### Updating

Images are automatically built and pushed to Docker Hub on every commit to the `main` branch, so there is technically no need to pull the latest files in. To update your local instance:

1. Make a backup of your MongoDB data just in case since data migrations may occur
2. Set restart policy of following containers to "None" and restart machine.   
*monitorss-prod-monolith-1  
      *monitorss-prod-bot-presence-service-1  
      *monitorss-prod-feed-requests-redis-cache-1  
      *monitorss-prod-discord-rest-listener-service-1  
      *monitorss-prod-monolith-1  
      *monitorss-prod-legacy-feed-bulk-converter-service-1  
      *monitorss-prod-schedule-emitter-service-1
      *monitorss-prod-user-feeds-service-1
      *monitorss-prod-mongo-1
4. Stop containers with `docker compose rm --stop -f`
5. Pull latest images with `docker compose pull`
6. Start containers with `docker compose up -d`

## Migrating from v6

If you've been using MonitoRSS v6 (used by the repo https://github.com/synzen/MonitoRSS-Clone), then these are instructions to migrate off of that repo to use the latest changes.

It's recommended that you don't delete your v6 files until you've confirmed that all your feeds are working as expected post-migration.

1. Follow the instructions above to self host. Be sure to clone this repo - the [clone repo](https://github.com/synzen/MonitoRSS-Clone) is no longer used or maintained.
2. In your `.env.prod` file, set `BACKEND_API_MONGODB_URI` to your MongoDB URI
3. Run `docker compose --parallel 1 up -d --build`
    - If you run into issues with network timeouts, pass the parallel flag to only build 1 container at once: `docker compose --parallel 1 up -d`
5. Access the control panel via http://localhost:8000/servers and convert all your legacy feeds to personal feeds. Legacy feed articles will not be fetched/delivered until they are converted to personal feeds.
6. After verifying that all is working as expected, you may delete your v6 files.
