const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const auth = require('../../middleware/auth');
const User = require('../../models/Users');
const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const {
  validationResult,
  check,
  body
} = require('express-validator');
//@route  Create Post
//@access  Private
router.post(
  '/',
  [auth, [check('text', 'Text  is Required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');
      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });
      const postObJ = await newPost.save();

      res.json(newPost);
    } catch (error) {
      console.error(error.message);

      res.status(500).send('server error');
    }
  }
);

//@route  Get all Post
//@access  Private

router.get('/', auth, async (req, res) => {
  try {

    const posts = await Post.find().sort({
      date: -1
    })
    res.json(posts)
  } catch (error) {
    console.error(error.message);

    res.status(500).send('server error');
  }

});

//@route  Get all Post
//@access  Private

router.get('/', auth, async (req, res) => {
  try {

    const posts = await Post.find().sort({
      date: -1
    })
    res.json(posts)
  } catch (error) {
    console.error(error.message);

    res.status(500).send('server error');
  }

});

//@route  Get Posts/:id
//@access  Private

router.get('/:id', auth, async (req, res) => {
  try {

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        msg: 'post not found'
      })
    }
    res.json(post)
  } catch (error) {
    console.error(error.message);
    if (error instanceof mongoose.CastError) {
      return res.status(404).json({
        msg: 'post not found'
      })
    }
    res.status(500).send('server error');
  }

});

//@route  Delete Posts/:id
//@access  Private

router.delete('/:id', auth, async (req, res) => {
  try {

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        msg: 'post not found'
      })
    }

    //checkuser

    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({
        msg: 'User Not Authorized'
      })
    } else {
      await post.remove();
    }

    res.json({
      msg: 'Post Removed'
    })
  } catch (error) {
    console.error(error.message);
    if (error instanceof mongoose.CastError) {
      return res.status(404).json({
        msg: 'post not found'
      })
    }
    res.status(500).send('server error');
  }

});

//@route  put  Posts/like/:id
//@access  Private


router.put('/like/:id', auth, async (req, res) => {
  try {

    const post = await Post.findById(req.params.id);

    if (post.likes.filter(like => like.user.toString() == req.user.id).length > 0) {
      return res.status(400).json({
        msg: 'post already liked'
      })
    }

    post.likes.unshift({
      user: req.user.id
    });

    await post.save();
    res.json(post.likes)

  } catch (error) {
    console.error(error.message);
    if (error instanceof mongoose.CastError) {
      return res.status(404).json({
        msg: 'post not found'
      })
    }
    res.status(500).send('server error');
  }
});
//@route  Delete Posts/like/:id
//@access  Private
router.put('/unlike/:id', auth, async (req, res) => {
  try {

    const post = await Post.findById(req.params.id);

    if (post.likes.filter(like => like.user.toString() == req.user.id).length == 0) {
      return res.status(400).json({
        msg: 'post has not yet been liked'
      })
    }



    const removeIndex = post.likes.map(like => like.user.toString().indexOf(req.user.id))

    post.likes.splice(removeIndex, 1);

    await post.save();
    res.json(post.likes)

  } catch (error) {
    console.error(error.message);
    if (error instanceof mongoose.CastError) {
      return res.status(404).json({
        msg: 'post not found'
      })
    }
    res.status(500).send('server error');
  }
})

//@route  Create Post comment
//@access  Private
router.post(
  '/comment/:id',
  [auth, [check('text', 'Text  is Required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');

      const post = await Post.findById(req.params.id)
      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };

      post.comments.unshift(newComment)

      await post.save();

      res.json(post.comments);
    } catch (error) {
      console.error(error.message);

      res.status(500).send('server error');
    }
  }
);




//@route  Delete Post comment
//@access  Private
router.delete(
  '/comment/:id/:comment_id',
  auth,
  async (req, res) => {


    try {
      const post = await Post.findById(req.params.id)

      const comment = post.comments.find(comment => comment.id == req.params.comment_id);

      if (!comment) {
        return res.status(404).json({
          msg: 'comment doesnot exist'
        })
      }
      if (comment.user.toString() !== req.user.id) {

        return res.status(401).json({
          msg: 'User not found'
        })
      }
      const removeIndex = post.comments.map(comment => comment.user.toString().indexOf(req.user.id))
      post.comments.splice(removeIndex, 1);
      await post.save();

      res.json(post.comments);
    } catch (error) {
      console.error(error.message);

      res.status(500).send('server error');
    }
  }
);


module.exports = router;