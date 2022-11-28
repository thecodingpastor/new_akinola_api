const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const APIFeatures = require('../utils/APIFeatures');

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.json({
      status: 'success',
      data: doc,
    });
  });

exports.getAll = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let filter;
    if (populateOptions) filter = populateOptions;
    const features = new APIFeatures(Model.find().populate(filter), req.query)
      .filter()
      .sort()
      .limit()
      .paginate();

    const docs = await features.query;
    res.json({
      status: 'success',
      result: docs.length,
      data: docs,
      hasNext: docs.length === 10,
    });
  });

exports.getOne = (Model, docName, populateOptions) =>
  catchAsync(async (req, res, next) => {
    const { userId, postId } = req.params;
    let id;
    if (userId) id = userId;
    else if (postId) id = postId;
    // else id = id;
    let query = Model.findById(id);
    if (populateOptions) query = query.populate(populateOptions);
    const doc = await query;
    if (!doc) return next(new AppError(`That ${docName} does not exist`, 404));
    res.json({
      status: 'success',
      data: doc,
    });
  });

exports.updateOne = (Model, docName) =>
  catchAsync(async (req, res, next) => {
    const { userId, postId } = req.params;
    let id;
    // For Updating Resources
    if (userId) id = userId;
    else if (postId) id = postId;
    // The third param enables the newly updated object to be returned, and also to apply mongoose validations in req.body fields
    const doc = await Model.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) return next(new AppError(`That ${docName} does not exist`, 404));
    res.json({
      status: 'success',
      data: doc,
    });
  });

exports.deleteOne = (Model, docName) =>
  catchAsync(async (req, res, next) => {
    let id;
    if (req.params.userId) id = req.params.userId;
    else id = req.params.id;

    const doc = await Model.findByIdAndDelete(id);
    if (!doc) return next(new AppError(`That ${docName} does not exist`, 404));
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
