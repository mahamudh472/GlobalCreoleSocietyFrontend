import { useState, useEffect } from "react";
import { RxCross2 } from "react-icons/rx";
import { apiMethods } from "../utils/api";
import { ENDPOINTS } from "../config/apiConfig";

const EditAboutModal = ({ profile, onProfileUpdate, onClose }) => {
  const [activeModal, setActiveModal] = useState(null); // 'work', 'education', 'places'
  const [editingItem, setEditingItem] = useState(null); // track item being edited
  const [formData, setFormData] = useState({ company: "", position: "", description: "", collage: "", subject: "", name: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize data from profile
  const [workData, setWorkData] = useState([]);
  const [educationData, setEducationData] = useState([]);
  const [placesData, setPlacesData] = useState([]);

  // Load data from profile when component mounts or profile changes
  useEffect(() => {
    if (profile) {
      setWorkData(profile.works || []);
      setEducationData(profile.educations || []);
      setPlacesData(profile.locations || []);
    }
  }, [profile]);

  const handleInputChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  // Open modal for editing or adding
  const openModal = (type, item = null) => {
    setError(null);
    if (item) { // editing
      setEditingItem({ type, id: item.id });
      if (type === "work") {
        setFormData({ company: item.company || "", position: item.position || "", description: item.description || "", collage: "", subject: "", name: "" });
      } else if (type === "education") {
        setFormData({ company: "", position: "", description: item.description || "", collage: item.collage || "", subject: item.subject || "", name: "" });
      } else if (type === "places") {
        setFormData({ company: "", position: "", description: "", collage: "", subject: "", name: item.name || "" });
      }
    } else { // adding
      setEditingItem(null);
      setFormData({ company: "", position: "", description: "", collage: "", subject: "", name: "" });
    }
    setActiveModal(type);
  };

  const closeModal = () => {
    setActiveModal(null);
    setError(null);
  };

  const handleSaveOrAdd = async () => {
    setLoading(true);
    setError(null);

    try {
      let updatedProfile = { ...profile };
      
      if (editingItem) {
        // Update existing item
        const { type, id } = editingItem;
        let response;
        
        if (type === "work") {
          response = await apiMethods.patch(ENDPOINTS.AUTH.WORK_DETAIL(id), {
            company: formData.company,
            position: formData.position,
            description: formData.description
          });
          const newWorkData = workData.map(w => w.id === id ? response.data : w);
          setWorkData(newWorkData);
          updatedProfile.works = newWorkData;
        } else if (type === "education") {
          response = await apiMethods.patch(ENDPOINTS.AUTH.EDUCATION_DETAIL(id), {
            collage: formData.collage,
            subject: formData.subject,
            description: formData.description
          });
          const newEducationData = educationData.map(e => e.id === id ? response.data : e);
          setEducationData(newEducationData);
          updatedProfile.educations = newEducationData;
        } else if (type === "places") {
          response = await apiMethods.patch(ENDPOINTS.AUTH.LOCATION_DETAIL(id), {
            name: formData.name
          });
          const newPlacesData = placesData.map(p => p.id === id ? response.data : p);
          setPlacesData(newPlacesData);
          updatedProfile.locations = newPlacesData;
        }
      } else {
        // Add new item
        let response;
        
        if (activeModal === "work") {
          response = await apiMethods.post(ENDPOINTS.AUTH.WORKS, {
            company: formData.company,
            position: formData.position,
            description: formData.description
          });
          const newWorkData = [...workData, response.data];
          setWorkData(newWorkData);
          updatedProfile.works = newWorkData;
        } else if (activeModal === "education") {
          response = await apiMethods.post(ENDPOINTS.AUTH.EDUCATIONS, {
            collage: formData.collage,
            subject: formData.subject,
            description: formData.description
          });
          const newEducationData = [...educationData, response.data];
          setEducationData(newEducationData);
          updatedProfile.educations = newEducationData;
        } else if (activeModal === "places") {
          response = await apiMethods.post(ENDPOINTS.AUTH.LOCATIONS, {
            name: formData.name
          });
          const newPlacesData = [...placesData, response.data];
          setPlacesData(newPlacesData);
          updatedProfile.locations = newPlacesData;
        }
      }

      // Notify parent of update
      if (onProfileUpdate) {
        onProfileUpdate(updatedProfile);
      }

      closeModal();
    } catch (err) {
      console.error("Failed to save:", err);
      setError(err.response?.data?.detail || "Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type, id) => {
    setLoading(true);
    setError(null);

    try {
      let updatedProfile = { ...profile };
      
      if (type === "work") {
        await apiMethods.delete(ENDPOINTS.AUTH.WORK_DETAIL(id));
        const newWorkData = workData.filter(w => w.id !== id);
        setWorkData(newWorkData);
        updatedProfile.works = newWorkData;
      } else if (type === "education") {
        await apiMethods.delete(ENDPOINTS.AUTH.EDUCATION_DETAIL(id));
        const newEducationData = educationData.filter(e => e.id !== id);
        setEducationData(newEducationData);
        updatedProfile.educations = newEducationData;
      } else if (type === "places") {
        await apiMethods.delete(ENDPOINTS.AUTH.LOCATION_DETAIL(id));
        const newPlacesData = placesData.filter(p => p.id !== id);
        setPlacesData(newPlacesData);
        updatedProfile.locations = newPlacesData;
      }

      // Notify parent of update
      if (onProfileUpdate) {
        onProfileUpdate(updatedProfile);
      }
    } catch (err) {
      console.error("Failed to delete:", err);
      setError(err.response?.data?.detail || "Failed to delete. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-gray-50">
      {/* Sidebar */}
      <div className="min-w-lg bg-white shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-6">Edit About Me</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Work Section */}
        <div className="mb-8">
          <div className="flex justify-between mb-3">
            <h3 className="text-lg font-medium">Work</h3>
            <button onClick={() => openModal("work")} className="text-blue-500 hover:text-blue-600 text-sm flex items-center">
              <span className="mr-1">+</span> Add
            </button>
          </div>
          {workData.length === 0 ? (
            <p className="text-gray-500 text-sm py-2">No work experience added yet</p>
          ) : (
            workData.map(w => (
              <div key={w.id} className="flex justify-between py-2 px-3 bg-gray-50 rounded mb-2">
                <span className="truncate">{w.position ? `${w.position} at ${w.company}` : `Works at ${w.company}`}</span>
                <div className="flex space-x-2 flex-shrink-0 ml-2">
                  <button onClick={() => openModal("work", w)} className="text-blue-500 hover:text-blue-600 text-sm">Edit</button>
                  <button onClick={() => handleDelete("work", w.id)} disabled={loading} className="text-red-500 hover:text-red-600 text-sm disabled:opacity-50">Delete</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Education Section */}
        <div className="mb-8">
          <div className="flex justify-between mb-3">
            <h3 className="text-lg font-medium">Education</h3>
            <button onClick={() => openModal("education")} className="text-blue-500 hover:text-blue-600 text-sm flex items-center">
              <span className="mr-1">+</span> Add
            </button>
          </div>
          {educationData.length === 0 ? (
            <p className="text-gray-500 text-sm py-2">No education added yet</p>
          ) : (
            educationData.map(e => (
              <div key={e.id} className="flex justify-between py-2 px-3 bg-gray-50 rounded mb-2">
                <span className="truncate">{e.subject ? `Studied ${e.subject} at ${e.collage}` : `Studied at ${e.collage}`}</span>
                <div className="flex space-x-2 flex-shrink-0 ml-2">
                  <button onClick={() => openModal("education", e)} className="text-blue-500 hover:text-blue-600 text-sm">Edit</button>
                  <button onClick={() => handleDelete("education", e.id)} disabled={loading} className="text-red-500 hover:text-red-600 text-sm disabled:opacity-50">Delete</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Places Section */}
        <div className="mb-8">
          <div className="flex justify-between mb-3">
            <h3 className="text-lg font-medium">Places Lived</h3>
            <button onClick={() => openModal("places")} className="text-blue-500 hover:text-blue-600 text-sm flex items-center">
              <span className="mr-1">+</span> Add
            </button>
          </div>
          {placesData.length === 0 ? (
            <p className="text-gray-500 text-sm py-2">No places added yet</p>
          ) : (
            placesData.map(p => (
              <div key={p.id} className="flex justify-between py-2 px-3 bg-gray-50 rounded mb-2">
                <span className="truncate">{p.name}</span>
                <div className="flex space-x-2 flex-shrink-0 ml-2">
                  <button onClick={() => openModal("places", p)} className="text-blue-500 hover:text-blue-600 text-sm">Edit</button>
                  <button onClick={() => handleDelete("places", p.id)} disabled={loading} className="text-red-500 hover:text-red-600 text-sm disabled:opacity-50">Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal (always mounted, only hidden if not active) */}
      {activeModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] bg-black/30" onClick={closeModal}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-[90%] max-w-lg overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingItem ? "Edit" : "Add"} {activeModal === "work" ? "Work" : activeModal === "education" ? "Education" : "Place"}
              </h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <RxCross2 size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
                {error}
              </div>
            )}

            {activeModal === "work" && (
              <>
                <input 
                  type="text" 
                  placeholder="Company" 
                  value={formData.company} 
                  onChange={e => handleInputChange("company", e.target.value)} 
                  className="w-full border px-3 py-2 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
                <input 
                  type="text" 
                  placeholder="Position" 
                  value={formData.position} 
                  onChange={e => handleInputChange("position", e.target.value)} 
                  className="w-full border px-3 py-2 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
                <textarea 
                  placeholder="Description (optional)" 
                  value={formData.description} 
                  onChange={e => handleInputChange("description", e.target.value)} 
                  className="w-full border px-3 py-2 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  rows={3} 
                />
              </>
            )}

            {activeModal === "education" && (
              <>
                <input 
                  type="text" 
                  placeholder="School/College" 
                  value={formData.collage} 
                  onChange={e => handleInputChange("collage", e.target.value)} 
                  className="w-full border px-3 py-2 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
                <input 
                  type="text" 
                  placeholder="Subject/Degree" 
                  value={formData.subject} 
                  onChange={e => handleInputChange("subject", e.target.value)} 
                  className="w-full border px-3 py-2 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
                <textarea 
                  placeholder="Description (optional)" 
                  value={formData.description} 
                  onChange={e => handleInputChange("description", e.target.value)} 
                  className="w-full border px-3 py-2 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  rows={3} 
                />
              </>
            )}

            {activeModal === "places" && (
              <input 
                type="text" 
                placeholder="Location (e.g., New York, USA)" 
                value={formData.name} 
                onChange={e => handleInputChange("name", e.target.value)} 
                className="w-full border px-3 py-2 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            )}

            <button 
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed mt-2" 
              onClick={handleSaveOrAdd}
              disabled={loading}
            >
              {loading ? "Saving..." : (editingItem ? "Save Changes" : "Add")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditAboutModal;
