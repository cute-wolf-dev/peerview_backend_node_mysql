'use strict';

/**
 * @author Jo-Ries Canino
 * @description Community Post Report
 */

const lib = require('../../lib/rpc');

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
    communityPostId: {
      notEmpty: {
        errorMessage: 'Missing Resource: Community Post Id'
      }
    },
    reason: {
      notEmpty: {
        errorMessage: 'Missing Resource: Reason'
      }
    }
  };

  let headerSchema = {
    token: {
      notEmpty: {
        errorMessage: 'Missing Resource: Token'
      }
    }
  };

  req.checkBody(bodySchema);
  req.headerSchema(headerSchema);
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
 * This would be the fallback if the user existed
 * In which if the user is still unverified
 * @see {@link lib/isUserTokenExist}
 * @see isUserTokenExist
 * @param {any} req request object
 * @param {any} res response object
 * @param {any} next next object
 * @returns {next} returns the next handler - success response
 * @returns {rpc} returns the validation error - failed response
 */
function postCommunityReport (req, res, next) {
  let user = req.$scoper.user;
  let reason = req.$params.reason;
  let communityPostId = req.$params.communityPostId;

  return req.db.communityPostReport.create({
    reportBy: user.id,
    communityPostId: communityPostId,
    reason: reason
  })
  .then(communityPostReport => {
    req.$scope.postReport = communityPostReport;
    next();
    return communityPostReport;
  })
  .catch(error => {
    res.status(500)
    .send(new lib.rpc.InternalError(error));

    req.log.error({
      err: error
    }, 'post.create Error - post-post-report');
  });
}

/**
 * Response data to client
 * @param {any} req request object
 * @param {any} res response object
 * @returns {any} body response object
 */
function response (req, res) {
  let communityPostReport = req.$scope.communityPostReport;
  let body = {
    status: 'SUCCESS',
    status_code: 0,
    http_code: 201,
    communityPostReport: communityPostReport
  };

  res.status(201).send(body);
}

module.exports.validateParams = validateParams;
module.exports.logic = postCommunityReport;
module.exports.response = response;
