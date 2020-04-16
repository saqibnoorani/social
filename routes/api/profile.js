const express = require('express');
const router = express.Router();
const Profile = require('../../models/Profile');
const User = require('../../models/Users');
const Post = require('../../models/Post');

const auth = require('../../middleware/auth');
const mongoose = require('mongoose');
const request = require('request');
const config = require('config');
const { validationResult, check, body } = require('express-validator');
const { response } = require('express');

router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate('user', ['name', 'avatar']);

    if (!profile) {
      return res
        .status(400)
        .json({ msg: ' There is no profile for this user' });
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
//@route  Post api/profile
//@access  Private
//@desc get current users profile

router.post(
  '/',
  [
    auth,
    check('status', 'status is required').not().isEmpty(),
    check('skills', 'Skills is required').not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin,
    } = req.body;

    //build profile object

    const profileFields = {};
    profileFields.user = req.user.id;
    profileFields.company = company || null;
    profileFields.website = website || null;
    profileFields.location = location || null;
    profileFields.bio = bio || null;
    profileFields.status = status || null;
    profileFields.githubusername = githubusername || null;
    profileFields.skills =
      skills.split(',').map((skill) => skill.trim()) || null;

    profileFields.social = {};

    profileFields.social.youtube = youtube || null;
    profileFields.social.twitter = twitter || null;
    profileFields.social.instagram = instagram || null;
    profileFields.social.linkedin = linkedin || null;

    try {
      let profile = await Profile.findOne({ user: req.user.id });
      if (profile) {
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );

        return res.json(profile);
      }

      profile = new Profile(profileFields);

      await profile.save();
      res.json(profile);
    } catch (err) {
      console.log(err.message);
      res.send(500).send('Server Error');
    }
  }
);

//@route  get api/profile
//@access  Public
//@desc get all user profiles

router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);

    res.json(profiles);
  } catch (error) {
    console.log(error.message);
    res.send(500).json('Server Error');
  }
});

//@route  get api/profile/user/:user_id
//@access  Public
//@desc get profile by user id

router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate('user', ['name', 'avatar']);
    if (!profile) {
      return res.status(400).json({ msg: 'Profile not Found' });
    }
    res.json(profile);
  } catch (err) {
    console.log(err.name);
    if (err instanceof mongoose.CastError) {
      return res.status(400).json({ msg: 'Profile not Found' });
    }
    res.status(500).json('Server Error');
  }
});

//@route  Delete api/profile
//@access  Private
//@desc Delete Profile

router.delete('/', auth, async (req, res) => {
  try {
    await Post.deleteMany({ user: req.user.id })
    await Profile.findOneAndRemove({
      user: req.user.id,
    });
    await User.findOneAndRemove({
      _id: req.user.id,
    });
    res.json({ msg: 'User Removed' });
  } catch (err) {
    console.log(err.name);
    res.status(500).json('Server Error');
  }
});

//@route  Put api/profile
//@access  Private
//@desc PUt profile experience

router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('company', 'company is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.experience.unshift(newExp);
      await profile.save();
      res.json(profile);
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Server Error');
    }
  }
);

//@route  Delete experience
//@access  Private
//@desc Delete experience

router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    });

    removeIndex = profile.experience
      .map((item) => item.id)
      .indexOf(req.params.exp_id);

    profile.experience.splice(removeIndex, 1);

    await profile.save();
    res.json(profile);
  } catch (err) {
    console.log(err);
    res.status(500).json('Server Error');
  }
});

//@route  Put api/profile/education
//@access  Private
//@desc PUt profile education

router.put(
  '/education',
  [
    auth,
    [
      check('school', 'school is required').not().isEmpty(),
      check('degree', 'degree is required').not().isEmpty(),
      check('fieldofstudy', 'fieldofstudy is required').not().isEmpty(),
      check('from', 'from is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    console.log(req.body)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    } = req.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.education.unshift(newEdu);
      await profile.save();
      res.json(profile);
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Server Error');
    }
  }
);

//@route  Delete education
//@access  Private
//@desc Delete education

router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    });

    removeIndex = profile.education
      .map((item) => item.id)
      .indexOf(req.params.edu_id);

    profile.education.splice(removeIndex, 1);

    await profile.save();
    res.json(profile);
  } catch (err) {
    console.log(err);
    res.status(500).json('Server Error');
  }
});

//@route  /github/:username
//@access  Public
//@desc Get user repos from github

router.get('/github/:username', (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
        }/repos?per_page=5&sort=created:asc&client_id=${config.get(
          'githubClientId'
        )}&client_secret=${config.get('githubSecret')}`,
      method: 'Get',
      headers: { 'user-agent': 'node-js' },
    };
    console.log(options.uri);

    request(options, (error, response, body) => {
      if (error) {
        console.log(error);
      }

      if (response.statusCode !== 200) {
        res.status(400).json({ msg: 'No github profile found' });
      }

      res.json(JSON.parse(body));
    });
  } catch (error) {
    res.status(500).json('server error');
  }
});

module.exports = router;
