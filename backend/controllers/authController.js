const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Volunteer = require('../models/Volunteer');
const EmergencyContact = require('../models/EmergencyContact');
const { dbStore } = require('../models/dbStore');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_women_safety_key';

// Helper to generate IDs for in-memory DB
const generateId = () => Math.random().toString(36).substring(2, 15);

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const assignedRole = role === 'Volunteer' ? 'Volunteer' : 'User';

    if (global.useInMemoryDb) {
      const exists = dbStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (exists) return res.status(400).json({ error: 'Email already exists' });

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const userId = generateId();

      const newUser = {
        _id: userId,
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: assignedRole,
        phone,
        createdAt: new Date()
      };

      dbStore.users.push(newUser);

      if (assignedRole === 'Volunteer') {
        dbStore.volunteers.push({
          _id: generateId(),
          userId,
          name,
          phone,
          verificationStatus: 'Pending',
          isOnline: false,
          currentLocation: { type: 'Point', coordinates: [77.5946, 12.9716] },
          updatedAt: new Date()
        });
      }

      const token = jwt.sign({ id: userId, role: assignedRole }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({
        token,
        user: { id: userId, name, email, role: assignedRole, phone }
      });
    } else {
      const exists = await User.findOne({ email: email.toLowerCase() });
      if (exists) return res.status(400).json({ error: 'Email already exists' });

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const user = new User({
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: assignedRole,
        phone
      });

      await user.save();

      if (assignedRole === 'Volunteer') {
        const volunteer = new Volunteer({
          userId: user._id,
          name: user.name,
          phone: user.phone,
          verificationStatus: 'Pending',
          isOnline: false,
          currentLocation: { type: 'Point', coordinates: [77.5946, 12.9716] }
        });
        await volunteer.save();
      }

      const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone }
      });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    let user;
    if (global.useInMemoryDb) {
      user = dbStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    } else {
      user = await User.findOne({ email: email.toLowerCase() });
    }

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const userId = user._id.toString();
    const token = jwt.sign({ id: userId, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: userId, name: user.name, email: user.email, role: user.role, phone: user.phone }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    let user;
    let contacts = [];

    if (global.useInMemoryDb) {
      user = dbStore.users.find(u => u._id === userId);
      contacts = dbStore.emergencyContacts.filter(c => c.userId === userId);
    } else {
      user = await User.findById(userId).select('-passwordHash');
      contacts = await EmergencyContact.find({ userId });
    }

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone },
      emergencyContacts: contacts
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
};

exports.addEmergencyContact = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, relationship } = req.body;

    if (!name || !phone || !relationship) {
      return res.status(400).json({ error: 'Name, phone, and relationship are required' });
    }

    if (global.useInMemoryDb) {
      const contact = {
        _id: generateId(),
        userId,
        name,
        phone,
        relationship,
        isNotifiedBySOS: true,
        createdAt: new Date()
      };
      dbStore.emergencyContacts.push(contact);
      return res.status(211).json(contact);
    } else {
      const contact = new EmergencyContact({
        userId,
        name,
        phone,
        relationship,
        isNotifiedBySOS: true
      });
      await contact.save();
      return res.status(201).json(contact);
    }
  } catch (error) {
    console.error('Add contact error:', error);
    res.status(500).json({ error: 'Server error adding contact' });
  }
};

exports.deleteEmergencyContact = async (req, res) => {
  try {
    const userId = req.user.id;
    const { contactId } = req.params;

    if (global.useInMemoryDb) {
      const initialLength = dbStore.emergencyContacts.length;
      dbStore.emergencyContacts = dbStore.emergencyContacts.filter(
        c => !(c._id === contactId && c.userId === userId)
      );
      if (dbStore.emergencyContacts.length === initialLength) {
        return res.status(404).json({ error: 'Contact not found' });
      }
      return res.json({ success: true, message: 'Contact removed' });
    } else {
      const contact = await EmergencyContact.findOneAndDelete({ _id: contactId, userId });
      if (!contact) return res.status(404).json({ error: 'Contact not found' });
      return res.json({ success: true, message: 'Contact removed' });
    }
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Server error removing contact' });
  }
};
