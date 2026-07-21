import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const PREDEFINED_LOCATIONS = [
  'DC-East Rack 12',
  'DC-East Rack 14',
  'DC-East Rack 15',
  'DC-East Rack 20',
  'DC-West Rack 01',
  'DC-West Rack 02',
  'DC-West Rack 05',
  'DC-West Rack 10',
  'Server Room',
  'HQ Office',
  'Branch Office',
  'Remote'
];

const PREDEFINED_TEAMS = [
  'Infra Team Alpha',
  'Infra Team Beta',
  'Network Team',
  'Storage Team',
  'Web Ops Team',
  'Database Admin Team',
  'Facilities',
  'AI Research',
  'Data Science',
  'Unassigned'
];

const AssetFormModal = ({ asset, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Server',
    status: 'Active',
    purchase_date: '',
    end_of_life: '',
    notes: ''
  });

  const [selectedLocation, setSelectedLocation] = useState('DC-East Rack 12');
  const [customLocation, setCustomLocation] = useState('');

  const [selectedAssignedTo, setSelectedAssignedTo] = useState('Infra Team Alpha');
  const [customAssignedTo, setCustomAssignedTo] = useState('');

  useEffect(() => {
    if (asset) {
      setFormData({
        name: asset.name || '',
        category: asset.category || 'Server',
        status: asset.status || 'Active',
        purchase_date: asset.purchase_date || '',
        end_of_life: asset.end_of_life || '',
        notes: asset.notes || ''
      });

      const existingLoc = asset.location || 'DC-East Rack 12';
      if (PREDEFINED_LOCATIONS.includes(existingLoc)) {
        setSelectedLocation(existingLoc);
        setCustomLocation('');
      } else {
        setSelectedLocation('Other');
        setCustomLocation(existingLoc);
      }

      const existingTeam = asset.assigned_to || 'Infra Team Alpha';
      if (PREDEFINED_TEAMS.includes(existingTeam)) {
        setSelectedAssignedTo(existingTeam);
        setCustomAssignedTo('');
      } else {
        setSelectedAssignedTo('Other');
        setCustomAssignedTo(existingTeam);
      }
    }
  }, [asset]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddWarranty = (monthsToAdd) => {
    const baseDate = formData.purchase_date ? new Date(formData.purchase_date) : new Date();
    baseDate.setMonth(baseDate.getMonth() + monthsToAdd);
    const formatted = baseDate.toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, end_of_life: formatted }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const finalLocation = selectedLocation === 'Other' ? customLocation : selectedLocation;
    const finalAssignedTo = selectedAssignedTo === 'Other' ? customAssignedTo : selectedAssignedTo;

    const submissionData = {
      ...formData,
      asset_tag: asset?.asset_tag || `TAG-${Date.now().toString().slice(-6)}`,
      location: finalLocation || 'Unassigned',
      assigned_to: finalAssignedTo || 'Unassigned',
      purchase_cost: asset?.purchase_cost || 0
    };
    
    onSave(submissionData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content card animate-fade-in" style={{ maxWidth: '620px' }}>
        <div className="modal-header">
          <h2>{asset ? 'Edit Asset' : 'Add New Asset'}</h2>
          <button onClick={onClose} className="icon-btn-small" aria-label="Close modal">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          {/* Row 1: Name & Category */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Asset Name *</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                required 
                placeholder="Enter asset name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select id="category" name="category" value={formData.category} onChange={handleChange} required>
                <option value="Server">Server</option>
                <option value="Network">Network</option>
                <option value="Storage">Storage</option>
                <option value="Power">Power</option>
                <option value="Workstation">Workstation</option>
                <option value="Laptop">Laptop</option>
                <option value="Security / Firewall">Security / Firewall</option>
                <option value="Cloud / Virtual">Cloud / Virtual</option>
                <option value="Peripheral">Peripheral</option>
                <option value="Software License">Software License</option>
              </select>
            </div>
          </div>

          {/* Row 2: Status & Location */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status">Status *</label>
              <select id="status" name="status" value={formData.status} onChange={handleChange} required>
                <option value="Active">Active</option>
                <option value="Warning">Warning</option>
                <option value="Critical">Critical</option>
                <option value="Decommissioned">Decommissioned</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="location">Location *</label>
              <select 
                id="location" 
                value={selectedLocation} 
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                {PREDEFINED_LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
                <option value="Other">Other (Specify manually)</option>
              </select>
            </div>
          </div>

          {selectedLocation === 'Other' && (
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label htmlFor="customLocation">Custom Location Name *</label>
              <input 
                type="text" 
                id="customLocation" 
                value={customLocation} 
                onChange={(e) => setCustomLocation(e.target.value)} 
                placeholder="Enter location name"
                required
              />
            </div>
          )}

          {/* Row 3: Assigned To */}
          <div className="form-row">
            <div className="form-group" style={{ width: '100%' }}>
              <label htmlFor="assigned_to">Assigned To *</label>
              <select 
                id="assigned_to" 
                value={selectedAssignedTo} 
                onChange={(e) => setSelectedAssignedTo(e.target.value)}
              >
                {PREDEFINED_TEAMS.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
                <option value="Other">Other (Specify manually)</option>
              </select>
            </div>
          </div>

          {selectedAssignedTo === 'Other' && (
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label htmlFor="customAssignedTo">Custom Assignee / Team *</label>
              <input 
                type="text" 
                id="customAssignedTo" 
                value={customAssignedTo} 
                onChange={(e) => setCustomAssignedTo(e.target.value)} 
                placeholder="Enter assignee or team"
                required
              />
            </div>
          )}

          {/* Row 4: Purchase Date & End of Life / Warranty side-by-side */}
          <div className="form-row" style={{ alignItems: 'flex-start' }}>
            <div className="form-group">
              <label htmlFor="purchase_date">Purchase Date</label>
              <input 
                type="date" 
                id="purchase_date" 
                name="purchase_date" 
                value={formData.purchase_date} 
                onChange={handleChange} 
              />
            </div>

            <div className="form-group">
              <label htmlFor="end_of_life">End of Life / Warranty</label>
              <input 
                type="date" 
                id="end_of_life" 
                name="end_of_life" 
                value={formData.end_of_life} 
                onChange={handleChange} 
              />
              {/* Quick Warranty Presets */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Quick Add:</span>
                {[
                  { label: '+6M', months: 6 },
                  { label: '+1Y', months: 12 },
                  { label: '+2Y', months: 24 },
                  { label: '+3Y', months: 36 },
                  { label: '+5Y', months: 60 }
                ].map(preset => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleAddWarranty(preset.months)}
                    style={{
                      padding: '3px 8px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      color: 'var(--color-primary)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title={`Add ${preset.label} from Purchase Date / Today`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 5: Notes */}
          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea 
              id="notes" 
              name="notes" 
              value={formData.notes} 
              onChange={handleChange} 
              rows="2"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary" style={{ minWidth: '120px' }}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ minWidth: '120px' }}>Save Asset</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetFormModal;
