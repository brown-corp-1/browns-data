# Browns-data
Browns-data manages API's data

## Table of content
* [1. Requirements](#requirements)
* [2. Installation Notes](#installation-notes)
* [3. Quick Start](#quick-start)
* [4. Development](#development)

## Requirements

* Git 2.15.0: https://git-scm.com/downloads
* MongoDB 3.4.9: https://www.mongodb.com/download-center#community
* Node.js 8.9.1: https://nodejs.org/es/download/

## Installation Notes

* Git:

  > Create an environment variable named git that contains the git's installation path

* MongoDB:

  > * Create a folder named data in C:
  > * Create a folder named db in the data folder
  > * Create a folder named log in the data folder
  
* MondoDB configuration:

  > * Create a text file named mongod.cfg in the data folder, the file should contains the following information  
  
  ```sh
      systemLog:
          destination: file
          path: c:\data\log\mongod.log 
      storage:
          dbPath: c:\data\db
      net:
         port: 27017	
      security:
        authorization: "enabled"
  ```
  
  > * Install the MongoDB service
  
  The following commands should be executed as administrator 
   
  ```sh
      mongod --config C:\data\mongod.cfg --install
  ```
  
  > * Start the MongoDB service
  
  ```sh
       net start MongoDB
  ```  
  
## Quick Start

1. Clone repository and go into project 

    ```sh
    git clone https://github.com/brown-corp-1/browns-data.git
    cd  browns-data
    ```

1. Install NPM dependencies.

    ```sh
    npm install
    ```

1. Run dev

    _Note_
    > Make sure you have run mongod, usually, it's on the path: C:\Program Files\MongoDB\Server\3.4\bin
    
    ```sh
    run npm dev
    ```
    
    The site will be available on localhost:4000
