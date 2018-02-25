/*eslint-disable max-len*/
'use strict';

/**
 * @author Jo-Ries Canino
 * @description Get a specific Post
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
  let paramsSchema = {
    postId: {
      isInt: {
        errorMessage: 'Invalid Resource: Post Id'
      }
    }
  };

  req.checkParams(paramsSchema);
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
 * @see {@link lib/isUserTokenExist}
 * @see isUserTokenExist
 * @param {any} req request object
 * @param {any} res response object
 * @param {any} next next object
 * @returns {next} returns the next handler - success response
 * @returns {rpc} returns the validation error - failed response
 */
function getPost (req, res, next) {
  let postId = req.$params.postId;
  const sequelize = req.db.postRating.sequelize;
  const colRating = sequelize.col(['postRating', 'rating'].join('.'));
  const colAVG = sequelize.fn('AVG', colRating);

  return req.db.post.findAll({
    attributes: [
      'id',
      'message',
      'title',
      'createdAt',
      [sequelize.fn('ROUND', colAVG, 2), 'roundedRating'],
      [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('postRating.id'))), 'ratingCount'],
      [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('postReply.id'))), 'postReplyCount'],
      [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('postLike.id'))), 'likeCount'],
      [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('postPageview.id'))), 'pageviewCount'],
      [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('postShare.id'))), 'shareCount'],
      [sequelize.fn('COUNT',
        sequelize.fn('DISTINCT', sequelize.where(sequelize.col('postLike.id')))),
      'isUserPostLike'],
      [sequelize.fn('COUNT',
        sequelize.fn('DISTINCT', sequelize.where(sequelize.col('postShare.id')))),
      'isUserPostShare']
    ],
    include: [{
      model: req.db.user,
      as: 'user',
      attributes: ['id', 'firstName', 'lastName', 'email', 'schoolName', 'profilePicture']
    }, {
      model: req.db.postRating,
      as: 'postRating',
      attributes: []
    }, {
      model: req.db.postLike,
      as: 'postLike',
      attributes: []
    }, {
      model: req.db.postReply,
      as: 'postReply',
      attributes: [],
    }, {
      model: req.db.postPageview,
      as: 'postPageview',
      attributes: []
    }, {
      model: req.db.post,
      foreignKey: 'sharePostId',
      as: 'postShare',
      attributes: []
    }, {
      model: req.db.attachment,
      attributes: []
    }],
    group: ['id'],
    where: {
      id: {
        [req.Op.eq]: postId
      }
    }
  })
  .then((posts) => {
    return req.db.post.prototype.getPOSTREPLY(posts, req.db)
    .then(() => req.db.post.prototype.getATTACHMENTS(posts));
  })
  .then((posts) => {
    req.$scope.posts = posts;
    next();
    return posts;
  })
  .catch(error => {
    res.status(500)
    .send(new lib.rpc.InternalError(error));

    req.log.error({
      err: error.message
    }, 'post.findAll Error - get-post');
  });
}

/**
 * Response data to client
 * @param {any} req request object
 * @param {any} res response object
 * @returns {any} body response object
 */
function response (req, res) {
  let post = req.$scope.post;
  let body = {
    status: 'SUCCESS',
    status_code: 0,
    http_code: 200,
    post: !post ? null : post
  };

  res.status(200).send(body);
}

module.exports.validateParams = validateParams;
module.exports.logic = getPost;
module.exports.response = response;
