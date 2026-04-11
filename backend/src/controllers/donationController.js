const Donation = require('../models/Donation');
const GlobalStats = require('../models/GlobalStats');


// ===============================
// ➕ CREATE DONATION (DONOR)
// ===============================
exports.createDonation = async (req, res, next) => {
  try {
    const {
      foodItems,
      description,
      weight,
      expiryTime,
      coordinates,
      ward,
      address,
      safetyDisclaimer
    } = req.body;

    if (!safetyDisclaimer) {
      return res.status(400).json({
        success: false,
        message: 'You must accept the food safety disclaimer.'
      });
    }

    if (!coordinates || coordinates.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Location coordinates are required.'
      });
    }

    const donation = await Donation.create({
      donorId: req.user._id,
      foodItems,
      description,
      weight: parseFloat(weight),
      expiryTime: new Date(expiryTime),
      imageUrl: req.file?.path || null,
      imagePublicId: req.file?.filename || null,
      location: {
        type: 'Point',
        coordinates: coordinates.map(Number)
      },
      ward,
      address,
      safetyDisclaimer: true
    });

    res.status(201).json({
      success: true,
      message: 'Donation posted successfully!',
      donation
    });

  } catch (err) {
    next(err);
  }
};


// ===============================
// 📍 GET NEARBY DONATIONS (NGO)
// ===============================
exports.getNearbyDonations = async (req, res, next) => {
  try {
    const { lng, lat, ward } = req.query;
    let donations;

    if (lng && lat) {
      // ✅ GEO QUERY
      donations = await Donation.find({
        status: 'AVAILABLE',
        expiryTime: { $gt: new Date() },
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(lng), parseFloat(lat)]
            },
            $maxDistance: 10000 // 10km
          }
        }
      })
        .populate('donorId', 'name phone')
        .sort({ createdAt: -1 })
        .limit(50);

    } else if (ward) {
      // ✅ WARD FALLBACK
      donations = await Donation.find({
        status: 'AVAILABLE',
        expiryTime: { $gt: new Date() },
        ward: { $regex: ward, $options: 'i' }
      })
        .populate('donorId', 'name phone')
        .sort({ createdAt: -1 })
        .limit(50);

    } else {
      // ✅ FALLBACK
      donations = await Donation.find({
        status: 'AVAILABLE',
        expiryTime: { $gt: new Date() }
      })
        .populate('donorId', 'name phone')
        .sort({ createdAt: -1 })
        .limit(50);
    }

    res.json({
      success: true,
      count: donations.length,
      donations
    });

  } catch (err) {
    next(err);
  }
};


// ===============================
// 📦 GET MY DONATIONS (DONOR)
// ===============================
exports.getMyDonations = async (req, res, next) => {
  try {
    const donations = await Donation.find({
      donorId: req.user._id
    })
      .populate('assignedNgo', 'name')
      .populate('assignedVolunteer', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      donations
    });

  } catch (err) {
    next(err);
  }
};


// ===============================
// 🏢 NGO CLAIM (ATOMIC)
// ===============================
exports.reserveDonation = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ✅ ONLY VERIFIED NGOs
    if (req.user.ngoVerification?.status !== 'EMAIL_VERIFIED') {
      return res.status(403).json({
        success: false,
        message: 'Only verified NGOs can claim donations.'
      });
    }

    // ✅ ATOMIC CLAIM + EXPIRY CHECK
    const donation = await Donation.findOneAndUpdate(
      {
        _id: id,
        status: 'AVAILABLE',
        expiryTime: { $gt: new Date() }
      },
      {
        status: 'RESERVED',
        assignedNgo: req.user._id,
        reservedAt: new Date()
      },
      { new: true }
    ).populate('donorId', 'name phone');


    if (!donation) {
      return res.status(409).json({
        success: false,
        message: 'This donation has already been claimed or expired.'
      });
    }

    res.json({
      success: true,
      message: 'Donation reserved successfully!',
      donation
    });

  } catch (err) {
    next(err);
  }
};


// ===============================
// 🚚 GET RESERVED (VOLUNTEER)
// ===============================
exports.getReservedDonations = async (req, res, next) => {
  try {
    const donations = await Donation.find({
      status: 'RESERVED',
      assignedVolunteer: null
    })
      .populate('donorId', 'name phone')
      .populate('assignedNgo', 'name')
      .sort({ reservedAt: 1 });

    res.json({
      success: true,
      donations
    });

  } catch (err) {
    next(err);
  }
};


// ===============================
// 🚚 ACCEPT DELIVERY
// ===============================
exports.acceptDelivery = async (req, res, next) => {
  try {
    const donation = await Donation.findOneAndUpdate(
      {
        _id: req.params.id,
        status: 'RESERVED',
        assignedVolunteer: null
      },
      {
        status: 'IN_TRANSIT',
        assignedVolunteer: req.user._id
      },
      { new: true }
    );

    if (!donation) {
      return res.status(409).json({
        success: false,
        message: 'Task no longer available.'
      });
    }

    res.json({
      success: true,
      message: 'Delivery task accepted!',
      donation
    });

  } catch (err) {
    next(err);
  }
};


// ===============================
// ✅ COMPLETE DELIVERY + IMPACT
// ===============================
exports.completeDonation = async (req, res, next) => {
  try {
    const donation = await Donation.findOneAndUpdate(
      {
        _id: req.params.id,
        status: 'IN_TRANSIT',
        assignedVolunteer: req.user._id
      },
      {
        status: 'COMPLETED',
        completedAt: new Date()
      },
      { new: true }
    );

    if (!donation) {
      return res.status(409).json({
        success: false,
        message: 'Cannot complete this donation.'
      });
    }

    // ✅ IMPACT CALCULATION
    const meals = Math.floor(donation.weight / 0.5);
    const co2 = parseFloat((donation.weight * 2.5).toFixed(2));

    donation.mealsProvided = meals;
    donation.co2Saved = co2;
    await donation.save();

    // ✅ GLOBAL STATS UPDATE
    await GlobalStats.findOneAndUpdate(
      {},
      {
        $inc: {
          totalDonations: 1,
          totalWeightKg: donation.weight,
          totalMealsProvided: meals,
          totalCO2SavedKg: co2
        },
        $set: { lastUpdated: new Date() }
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: '🎉 Delivery completed! Impact recorded.',
      donation
    });

  } catch (err) {
    next(err);
  }
};


// ===============================
// 📊 GLOBAL STATS
// ===============================
exports.getGlobalStats = async (req, res, next) => {
  try {
    const stats = await GlobalStats.findOne();

    res.json({
      success: true,
      stats: stats || {}
    });

  } catch (err) {
    next(err);
  }
};


// ===============================
// 🚚 VOLUNTEER TASKS
// ===============================
exports.getMyTasks = async (req, res, next) => {
  try {
    const tasks = await Donation.find({
      assignedVolunteer: req.user._id,
      status: { $in: ['IN_TRANSIT', 'COMPLETED'] }
    })
      .populate('donorId', 'name phone')
      .populate('assignedNgo', 'name')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      tasks
    });

  } catch (err) {
    next(err);
  }
};