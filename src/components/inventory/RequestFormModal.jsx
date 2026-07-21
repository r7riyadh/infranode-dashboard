import React, { useState } from 'react';
import { X } from 'lucide-react';

const RequestFormModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    item_description: '',
    reason: '',
    urgency: 'Medium',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content card animate-fade-in">
        <div className="modal-header">
          <h2>Request Equipment</h2>
          <button onClick={onClose} className="icon-btn-small" aria-label="Close modal">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="item_description">Item Description *</label>
            <input 
              type="text" 
              id="item_description" 
              name="item_description" 
              value={formData.item_description} 
              onChange={handleChange} 
              required 
              placeholder="Enter item description"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reason">Business Justification / Reason *</label>
            <textarea 
              id="reason" 
              name="reason" 
              value={formData.reason} 
              onChange={handleChange} 
              rows="3"
              required
              placeholder="Please explain why this item is needed..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="urgency">Urgency *</label>
            <select id="urgency" name="urgency" value={formData.urgency} onChange={handleChange} required>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Submit Request</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestFormModal;
