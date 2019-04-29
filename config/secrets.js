/*
 * You generally want to .gitignore this file to prevent important credentials from being stored on your public repo.
 */
module.exports = {
    token : "secret-starter-mern",
    mongo_connection : "mongodb+srv://dbUser:dbUserPassword@cluster0-6dl0r.gcp.mongodb.net/test?retryWrites=true"
    // mongo_connection : "mongodb+srv://cluster0-6dl0r.gcp.mongodb.net/test"
};
