# Advanced Odds and Evens

Built with:
- Server side: Node.js, Socket.io
- NPM Modules: Mustache.js, Moment.js, Qs.js

## Installation

### Prerequisites
Before you begin, make sure you have the following installed on your system:
- [Node.js](https://nodejs.org)
- [Git](https://git-scm.com) [Optional]

### Clone the repository
First, clone the repository using Git:

```bash
git clone https://github.com/Salamandeenie/Advanced_Odds_and_Evens.git
```

Alternatively, you can download the whole project by following these steps:
1. Go to the repository page: [Advanced_Odds_and_Evens](https://github.com/Salamandeenie/Advanced_Odds_and_Evens)
2. Click on the "Code" button.
3. Select "Download ZIP" to download the project as a ZIP file.
4. Extract the project using your system's built-in tools or your preferred file extractor.

### Fetch dependencies
Navigate to the project directory and install the required NPM modules by running the following command:

```bash
npm install
```

### Launch the chat server
To start the chat server, run one of the following commands:

```bash
npm run dev
```
or
```bash
node src/index.js
```
### Access the application
Once the server is running, open the following URL in your web browser:

[http://localhost:3000](http://localhost:3000)

If you are connecting from a LAN device, follow these steps:
1. Open a terminal or command prompt on the host machine.
2. Run the following command to get your local IP address:

   **Windows** (using `ipconfig`):
   ```bash
   ipconfig
   ```
  **MacOS / Linux** (using `ifconfig`):
  ```bash
  ifconfig
  ```
  
3. Look for the *IPv4* Address entry in the output of the command. It should display your local IP address.

On the LAN device, open a web browser and enter the following URL, replacing <your_local_ip_address> with the IP address obtained in step 3:
  ```bash
  http://<your_local_ip_address>:3000
  ```

## Special Thanks to:
[Kaganecee](https://codeload.github.com/kaganecee/nodejs-chat-app/zip/refs/heads/master) for providing the foundation for this project.

And a very special thanks to Mr. Guile, who help fuel my desire to learn web design.
