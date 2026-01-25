# telecrap
An example Telegram bot built with Telegraf that demonstrates the integration of Web UI elements (Telegram Mini Apps).

## Features
- Built on the most popular Telegram Bot API library for Node.js - Telegraf.
- Includes a Firebase implementation
- Demonstrates how to launch and interact with Web UI elements directly from the chat.
- Clean JavaScript implementation without unnecessary bloat.
- Includes linting rules to maintain code quality.

## Prerequisites
- Node.js (v16 or higher)
- npm
- A Telegram Bot Token (obtainable via @BotFather)
- A Firebase cert.json

## Installation & Usage
Before running, put `cert.json` into the current working directory of the application. After, run the following:

```bash
git clone https://github.com/bouncytorch/telecrap.git
cd telecrap
npm i
TOKEN="<your token>" DBURL="<your firebase db>" node .
```
