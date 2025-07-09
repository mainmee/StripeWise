# Friendly Advice: Tips and Tracks

## General Advice

- **Version control is your friend!** Commit often. You don't want to have to roll back a change, be you also want to always be able to!
- **AI is your friend!** Lean on tools like Github Copilot and ChatGPT to accelerate your research and development. A particularly good idea is to use AI to help explain a section of code to you
- **Read the docs:** The `.md` files contain important info to get you up and running. Also, read the Cloudflare docs carefully, they are really good and information dense.
- **Read the comments** helpful comments have been left throughout the codebase to help you get to grips with the code logic and semantics
- **Keep it simple:** Break complex tasks into smaller ones.
- **Be creative:** Mock out features if you don't have time to fully build them.
- **Be cool!** Enjoy the experience! Just throw yourself at the challenge and do you best to contribute positively in any way you can! Code is not everything, ideas, planning, and teamwork are absolutely crucial components of this project
 
## Seperating responsibility

**McpAgent vs ChatAgent** 

Because the McpAgent is technically decoupled from the ChatAgent completely, depending on how you would like to divide the work up in your team, it is entirely possible for two codebases to be worked on at the same time - one where tools are added to the McpAgent to build out the core functionality of the solution, while the other works on the ChatAgent and frontend, to perfect the look and feel as well as personalised experience components of the app. These codebases are then deployed seperately, potentially to different team members' Cloudflare accounts. To do this, you would simply point the `MCP_TOOLS_URL` to the worker to which the 'McpAgent focus' codebase is deployed. This means that your ChatAgent (deployed to say worker A) will automatically discover and call tools from the McpAgent deployed to worker B - this is opposed to the default mode where you would point this URL back to the same worker (you could even connect to the deployed McpAgent from your locally running project instead!). If you go this route, do not waste time stripping out pieces of the app you no longer need, just build on top of what is already existing (for example, if you are only going to work on building out the tools of the McpAgent, don't spend time stripping out the default frontend code if you don't need to, since you will be using the frontend from the other codebase anyways)

## Storage

Depending on your solution, you might want to implement some time of persistence of data (ie: a database). You are welcome to explore any options here, but you easiest option would likely be:

A) Use the state of the ChatAgent to store data (see `src/chat.ts`, particular the `setState` function). You can find docs here: [State in Cloudflare Agents](https://developers.cloudflare.com/agents/api-reference/store-and-sync-state/). You will see that this approach has actaully already been implemented in the starter project.

Other (higher effort and complexity) options include:

B) Using a [Cloudflare KV](https://developers.cloudflare.com/kv/) store as a database

C) Using [Cloudflare R2 Object storage](https://developers.cloudflare.com/r2/) if you need to store BLOB-like data (ex: images, files, etc)

D) Provision a [Cloudflare D1 SQL database](https://developers.cloudflare.com/d1/)

**PLEASE NOTE YOU DO NOT NEED TO IMPLEMENT ANY OF THESE IF YOU DO NOT NEED THEM FOR YOUR SOLUTION, THESE IS JUST TO GIVE YOU ALL THE INFORMATION**

## Fun Facts

- Investec Online, the web banking platform of Investec, is built on Cloudflare!
- Investec uses Microsoft Azure as its cloud provider - a very powerful cloud computing platform with a huge number of services for everything, from running and orchestrating containers, to organisation wide IAM, to AI model deployment, to data analytics and warehousing tools