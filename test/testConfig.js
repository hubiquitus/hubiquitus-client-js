/**
 * This file will be used for all config tests.
 * Set this with correct values before starting the tests
 */

//Connection options, change to bosh to test other transport
exports.hOptions = {
    transport : 'socketio',
    endpoints : ['http://localhost:8080/']
};
//exports.hOptions = {
//    transport : 'bosh',
//    endpoints : ['http://localhost:5280/http-bind']
//};

//Array of logins to use (some test need two users)
exports.logins = [{
    login: 'u1@localhost',
    password: 'u1'
}];

exports.hNode = 'hnode.localhost'; //Address of the hNode entity