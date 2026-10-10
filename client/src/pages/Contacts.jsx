import { useState, useEffect } from 'react';
import api from '../services/api';
import { UserPlus, Trash2, Edit2, ShieldAlert, Mail, MessageCircle, Send, MoreVertical, X } from 'lucide-react';

const AVATAR_COLORS = ['bg-[#FFB547]', 'bg-[#36D6AA]', 'bg-[#FF4D5E]', 'bg-[#9D84FF]', 'bg-[#A296B5]'];

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', relationship: '', notifyVia: ['email', 'telegram'] });
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await api.get('/contacts');
      setContacts(res.data);
    } catch (error) {
      console.error('Error fetching contacts', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleNotifyMethod = (method) => {
    setFormData(prev => {
      const isSelected = prev.notifyVia.includes(method);
      if (isSelected) {
        return { ...prev, notifyVia: prev.notifyVia.filter(m => m !== method) };
      } else {
        return { ...prev, notifyVia: [...prev.notifyVia, method] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/contacts/${editId}`, formData);
      } else {
        await api.post('/contacts', formData);
      }
      setIsSheetOpen(false);
      fetchContacts();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving contact');
    }
  };

  const handleAddNew = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData({ name: '', email: '', phone: '', relationship: '', notifyVia: ['email', 'telegram'] });
    setIsSheetOpen(true);
  };

  const handleEdit = (contact) => {
    setIsEditing(true);
    setEditId(contact._id);
    setFormData({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      relationship: contact.relationship || '',
      notifyVia: ['email', 'telegram']
    });
    setOpenMenuId(null);
    setIsSheetOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Remove this contact?')) {
      try {
        await api.delete(`/contacts/${id}`);
        fetchContacts();
      } catch (error) {
        alert('Error deleting contact');
      }
    }
    setOpenMenuId(null);
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-sora font-bold text-2xl text-text">Contacts</h1>
        {contacts.length > 0 && contacts.length < 5 && (
          <button onClick={handleAddNew} className="text-brand hover:text-brand/80 transition p-2">
            <UserPlus className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="flex-1">
        {contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <ShieldAlert className="w-12 h-12 text-text-muted mb-4" />
            <p className="text-text-muted mb-6">You haven't added any contacts yet.</p>
            <button 
              onClick={handleAddNew}
              className="px-6 h-12 bg-surface-raised border border-line rounded-DEFAULT font-bold text-text hover:bg-line transition"
            >
              Add your first contact
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            {contacts.map((contact, i) => {
              const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
              const hasTelegram = (contact.notifyVia || []).includes('telegram');
              const tConnected = contact.telegramChatId;
              
              return (
                <div key={contact._id} className="flex items-center justify-between py-4 border-b border-line">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center text-[#120F1A] font-bold text-lg font-sora shrink-0`}>
                      {getInitials(contact.name)}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text text-base leading-tight">{contact.name}</span>
                        {contact.relationship && (
                          <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted bg-surface-raised px-2 py-0.5 rounded-sm">
                            {contact.relationship}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2 mt-2">
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-brand" />
                          <MessageCircle className="w-4 h-4 text-[#36D6AA]" />
                          {tConnected ? (
                            <Send className="w-4 h-4 text-[#36D6AA]" />
                          ) : (
                            <Send className="w-4 h-4 text-text-muted opacity-30" />
                          )}
                        </div>
                        {!tConnected && (
                          <div className="bg-surface-raised p-2 rounded-sm border border-line mt-1">
                            <p className="text-xs text-text-muted mb-1">Connect Telegram so this contact gets instant alerts on their phone.</p>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(`https://t.me/SheAlertzBot?start=${contact._id}`);
                                alert('Connect link copied! Send this link to your contact.');
                              }}
                              className="text-xs font-bold text-warn underline"
                            >
                              Copy Connect Link
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <button onClick={() => setOpenMenuId(openMenuId === contact._id ? null : contact._id)} className="p-2 text-text-muted hover:text-text transition">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    
                    {openMenuId === contact._id && (
                      <div className="absolute right-0 top-10 w-32 bg-surface-raised border border-line rounded-DEFAULT shadow-lg z-10 overflow-hidden">
                        <button onClick={() => handleEdit(contact)} className="w-full text-left px-4 py-3 text-sm text-text font-medium hover:bg-line transition flex items-center gap-2">
                          <Edit2 className="w-4 h-4" /> Edit
                        </button>
                        <button onClick={() => handleDelete(contact._id)} className="w-full text-left px-4 py-3 text-sm text-sos font-medium hover:bg-line transition flex items-center gap-2">
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Bottom Sheet / Sidebar Overlay */}
      {isSheetOpen && (
        <div className="fixed inset-0 z-50 flex lg:justify-end justify-center items-end lg:items-stretch bg-bg/80 backdrop-blur-sm">
          <div className="w-full max-w-[480px] lg:w-[480px] bg-surface rounded-t-sheet lg:rounded-none h-[85vh] lg:h-full flex flex-col border-t lg:border-l lg:border-t-0 border-line shadow-[-10px_0_40px_rgba(0,0,0,0.5)]">
            <div className="w-full flex justify-center p-4 lg:hidden">
              <div className="w-12 h-1.5 bg-line rounded-full"></div>
            </div>
            
            <div className="flex justify-between items-center px-5 mb-6 lg:mt-8">
              <h2 className="font-sora font-bold text-xl text-text">{isEditing ? 'Edit Contact' : 'Add Contact'}</h2>
              <button onClick={() => setIsSheetOpen(false)} className="text-text-muted hover:text-text bg-surface-raised rounded-full p-2"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 pb-[env(safe-area-inset-bottom)] flex flex-col gap-5">
              <div>
                <label className="block text-sm font-bold text-text-muted mb-2">Name</label>
                <input name="name" type="text" required value={formData.name} onChange={handleChange} className="w-full h-14 px-4 bg-surface-raised border border-line rounded-DEFAULT text-text outline-none focus:border-brand transition" />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-muted mb-2">Email</label>
                <input name="email" type="email" required value={formData.email} onChange={handleChange} className="w-full h-14 px-4 bg-surface-raised border border-line rounded-DEFAULT text-text outline-none focus:border-brand transition" />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-muted mb-2">Phone</label>
                <input name="phone" type="tel" required value={formData.phone} onChange={handleChange} className="w-full h-14 px-4 bg-surface-raised border border-line rounded-DEFAULT text-text outline-none focus:border-brand transition" />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-muted mb-2">Relationship (Optional)</label>
                <input name="relationship" type="text" value={formData.relationship} onChange={handleChange} className="w-full h-14 px-4 bg-surface-raised border border-line rounded-DEFAULT text-text outline-none focus:border-brand transition" />
              </div>
              
              <div className="bg-surface p-4 rounded-DEFAULT border border-line">
                <p className="text-sm font-bold text-text mb-3">Notification Channels</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-brand" />
                    <span className="text-sm text-text-muted"><strong>Email</strong> (Automatic)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Send className="w-4 h-4 text-[#36D6AA]" />
                    <span className="text-sm text-text-muted"><strong>Telegram</strong> (Automatic once connected)</span>
                  </div>
                  <div className="flex items-start gap-3 mt-2">
                    <MessageCircle className="w-4 h-4 text-[#36D6AA] mt-0.5" />
                    <div className="flex flex-col">
                      <span className="text-sm text-text-muted"><strong>WhatsApp</strong> (Manual button)</span>
                      <span className="text-xs text-text-muted opacity-70 mt-1">Opens WhatsApp on your phone with the message ready. You tap send.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-6 pb-6">
                <button type="submit" className="w-full h-[56px] bg-brand text-bg rounded-DEFAULT font-bold text-lg hover:bg-brand/90 transition shadow-sm">
                  {isEditing ? 'Save Changes' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;
