# OverView:

It is the final project of the course Web Data Analytics. In terms of charts showing up on the dashboard, we chose the bar chart and grid. In our scenario, bar chart is better than the pie chart because we focus on the absolute number of users who can visit the page with low latency through a certain browser, instead of the relative number. When it comes to designing the grid, we only include three columns (user cookie, latency, and browser agent). Although there are other information that are insteresting to be included like the security and privacy preferences of users, we decide to make the grid columns simple because of the limit of the screen width.

# Members:

    - Jiayi Hu
    - Evan Martinez
    - Luis Orellana

# Authentication:

For authentication we were originally planning on using passport.js as suggested by the professor with a local database. However after looking at the documentation for passport it became apparent that it would add a lot of complicated overhead for and provide little benefit since we were just going to be using a database directly and not doing oauth. So instead we chose to implement password hashing and sessioning directly rather than using passport. For our encryption we searched around a little bit for a suitable algorithm. This youtube video was very helpful on explaining the techniques of hashing and salting https://www.youtube.com/watch?v=cjdiIKFYeXQ and also explained the theory of how the modern bcrypt algorithm works. We ended up using a js module of bcrypt for our cryptographic function as it was easy to use in our code and is pretty secure. Plain text passwords are sent to the authentication endpoint over SSL so this should reduce the risk of man in the middle attacks. Plain text passwords are only stored in memory on the server for a short amount of time while they are used to compute a hash. Once the hash is obtained the password is discarded with no way for us to retrieve it. Every page and endpoint aside from the login and logout page has a server side check to ensure a user is authenticated. If a user is not authenticated then no data will be sent to them and the server will issue a redirect to a login page.

# Dashboard:

based on client reporting. This data might be somewhat inaccurate as sometimes browsers report different compatibility settings, However it gives us a general idea of what types of browsers are being used to visit our site. As we learned in this class performance and specifically the rails model is very important, as we want users to have a good experience when visiting our site. So our second chart gives a histogram of load times across clients, it's notable that all of our load times are very small, likely because our site is just a small html file which takes little time to send. Finally for our grid we want to understand a little bit more information about our users, We list the provided browser language option, the screen resolution, and the web agent. This gives us a better understanding of the langauge and screen dimensions we should be trying to support.

# Report:

For our report we wanted to further investigate performance between different browsers to be able to better understand which browsers might need more content optimization. To do this we created a line chart to help visualize load times per browser. On our grid we track the unique user id and record the full agent and latency, this way we can look for outliers and see if there is a particular webkit or version of the agent that they are running, to help narrow down specific bugs within that agent version.
