'use strict';

/**
 * @author Jo-Ries Canino
 * @description Post Community Login
 */

const md5 = require('MD5');
const lib = require('../lib');

/**
 * Validation of req.body, req, param,
 * and req.query
 * @param {any} req request object
 * @param {any} res response object
 * @param {any} next next object
 * @returns {next} returns the next handler - success response
 * @returns {rpc} returns the validation error - failed response
 */
function validateParams (req, res, next) {
  let bodySchema = {
    email: {
      notEmpty: {
        errorMessage: 'Missing Resource: Email'
      },
      isEmail: {
        errorMessage: 'Invalid Resource: Email'
      }
    },
    password: {
      notEmpty: {
        errorMessage: 'Missing Resource: Password'
      },
      isAscii: {
        errorMessage: `Invalid Resource: Should only contain ASCII characters only`
      },
      isLength: {
        options: [{
          min: 8,
          max: 24
        }],
        errorMessage: `Invalid Resource: Minimum 8 and maximum 24 characters are allowed`
      }
    }
  };

  req.checkBody(bodySchema);
  return req.getValidationResult()
  .then(validationErrors => {
    if (validationErrors.array().length !== 0) {
      return res.status(400)
      .send(new lib.rpc.ValidationError(validationErrors.array()));
    }

    return next();
  })
  .catch(error => {
    res.status(500)
    .send(new lib.rpc.InternalError(error));
  });
}

function postCommunityLogin (req, res, next) {
  let email = req.$params.email;
  let password = md5(req.$params.password);

  return req.db.community.findOne({
    where: {
      [req.Op.and]: {
        email: email,
        password: password
      }
    }
  })
  .then(community => {
    if (!community) {
      return res.status(400).send({
        status: 'ERROR',
        status_code: 102,
        status_message: 'Invalid email or password',
        http_code: 400
      });
    }

    req.$scope.community = community;
    next();
    return community;
  })
  .catch(error => {
    res.status(500)
    .send(new lib.rpc.InternalError(error));

    req.log.error({
      err: error
    }, 'community.findOne Error - post-community-login');
  });
}

/**
 * Response data to client
 * @param {any} req request object
 * @param {any} res response object
 * @returns {any} body response object
 */
function response (req, res) {
  let community = req.$scope.community;
  let body = {
    status: 'SUCCESS',
    status_code: 0,
    http_code: 200,
    community: community
  };

  res.status(200).send(body);
}

module.exports.validateParams = validateParams;
module.exports.logic = postCommunityLogin;
module.exports.response = response;
