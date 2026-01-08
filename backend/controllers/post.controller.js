import Post from "../models/Post.js";

export const getPosts = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = 10;

  const posts = await Post.find()
    .populate("author")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json(posts);
};

export const createPost = async (req, res) => {
  const post = await Post.create(req.body);
  res.status(201).json(post);
};
