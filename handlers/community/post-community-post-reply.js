'use strict';

/**
 * @author Jo-Ries Canino
 * @description Community Post Reply
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
    comment: {
      notEmpty: {
        errorMessage: 'Missing Resource: Comment'
      },
      isLength: {
        options: [{
          min: 1,
          max: 280
        }],
        errorMessage: `Invalid Resource: Minimum 1 and maximum 280 characters are allowed`
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
function postCommunityPostReply (req, res, next) {// eslint-disable-line id-length
  let user = req.$scope.user;
  let communityPostId = req.$params.postId;
  let comment = req.$params.comment;

  return req.db.communityPostReply.create({
    communityPostId: communityPostId,
    userId: user.id,
    comment: comment
  })
  .then(communityPostReply => {
    req.$scope.communityPostReply = communityPostReply;
    next();
    return communityPostReply;
  })
  .catch(error => {
    res.status(500)
    .send(new lib.rpc.InternalError(error));

    req.log.error({
      err: error
    }, 'postReply.create Error - post-community-post-reply');
  });
}

/**
 * Response data to client
 * @param {any} req request object
 * @param {any} res response object
 * @returns {any} body response object
 */
function response (req, res) {
  let communityPostReply = req.$scope.communityPostReply;
  let body = {
    status: 'SUCCESS',
    status_code: 0,
    http_code: 201,
    communityPostReply: communityPostReply
  };

  res.status(201).send(body);
}

module.exports.validateParams = validateParams;
module.exports.logic = postCommunityPostReply;
module.exports.response = response;
