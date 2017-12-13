'use strict';

/**
 * @author Jo-Ries Canino
 * @description Get User Study Levels
 */

const lib = require('../../lib');

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
  let headerSchema = {
    token: {
      notEmpty: {
        errorMessage: 'Missing Resource: Token'
      }
    }
  };

  req.checkHeaders(headerSchema);
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

/**
 * This would be the fallback if the user
 * has a valid token
 * @see {@link lib/isUserTokenExist}
 * @see isUserTokenExist
 * @param {any} req request object
 * @param {any} res response object
 * @param {any} next next object
 * @returns {next} returns the next handler - success response
 * @returns {rpc} returns the validation error - failed response
 */
function getUserStudyLevels (req, res, next) {
  return req.db.userStudyLevel.findAll({})
  .then(userStudyLevel => {
    req.$scope.userStudyLevel = userStudyLevel;
    next();
    return userStudyLevel;
  })
  .catch(error => {
    res.status(500)
    .send(new lib.rpc.InternalError(error));

    req.log.error({
      err: error
    }, 'userStudyLevel.findAll Error - get-user-study-levels');
  });
}

/**
 * Response data to client
 * @param {any} req request object
 * @param {any} res response object
 * @returns {any} body response object
 */
function response (req, res) {
  let userStudyLevel = req.$scope.userStudyLevel;
  let body = {
    status: 'SUCCESS',
    status_code: 0,
    http_code: 200,
    userStudyLevel: userStudyLevel
  };

  res.status(200).send(body);
}

module.exports.validateParams = validateParams;
module.exports.logic = getUserStudyLevels;
module.exports.response = response;
