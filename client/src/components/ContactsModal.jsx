import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';

const ContactsModal = ({ onClose, onSelectContact }) => {
  const { theme } = useContext(ThemeContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState([
    { id: 1, name: 'Alice Johnson', phoneNumber: '+1 234-567-8900', status: 'online' },
    { id: 2, name: 'Bob Smith', phoneNumber: '+1 234-567-8901', status: 'offline' },
    { id: 3, name: 'Carol White', phoneNumber: '+1 234-567-8902', status: 'online' },
    { id: 4, name: 'David Brown', phoneNumber: '+1 234-567-8903', status: 'away' },
    { id: 5, name: 'Emma Davis', phoneNumber: '+1 234-567-8904', status: 'online' },
    { id: 6, name: 'Frank Miller', phoneNumber: '+1 234-567-8905', status: 'offline' },
  ]);

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phoneNumber.includes(searchQuery)
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`fixed inset-0 ${
        theme === 'dark' ? 'bg-black/50' : 'bg-black/30'
      } z-50 flex items-center justify-center p-4 animate-modal`}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        exit={{ y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden ${
          theme === 'dark' ? 'bg-gray-900' : 'bg-white'
        } shadow-2xl flex flex-col sci-fi-card animate-holographic`}
      >
        {/* Header */}
        <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between animate-holographic`}>
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-glow`}>
              📇 Contacts
            </h2>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-hologram`}>
              {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''}
            </p>
          </motion.div>
          <motion.button
            whileHover={{ rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className={`p-2 rounded-lg transition ${
              theme === 'dark'
                ? 'hover:bg-gray-800 text-gray-400'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            ✕
          </motion.button>
        </div>

        {/* Search Bar */}
        <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className={`flex items-center rounded-lg px-4 py-2 border ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-gray-50 border-gray-300'
          }`}>
            <svg className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`flex-1 bg-transparent ml-3 outline-none text-sm ${
                theme === 'dark'
                  ? 'text-white placeholder-gray-500'
                  : 'text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.length === 0 ? (
            <div className={`p-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              <p className="text-lg">😅 No contacts found</p>
              <p className="text-sm">Try a different search query</p>
            </div>
          ) : (
            <div className="divide-y" style={{
              borderColor: theme === 'dark' ? '#374151' : '#e5e7eb'
            }}>
              {filteredContacts.map((contact, index) => (
                <motion.button
                  key={contact.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onSelectContact(contact)}
                  whileHover={{ backgroundColor: theme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(0, 0, 0, 0.03)' }}
                  className={`w-full p-4 flex items-center justify-between text-left transition ${
                    theme === 'dark'
                      ? 'hover:bg-gray-800'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                        {contact.name[0]}
                      </div>
                      <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                        contact.status === 'online'
                          ? 'bg-green-500'
                          : contact.status === 'away'
                          ? 'bg-yellow-500'
                          : 'bg-gray-500'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {contact.name}
                      </p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {contact.phoneNumber}
                      </p>
                    </div>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="text-blue-500 text-lg"
                  >
                    →
                  </motion.div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ContactsModal;
