import React, { useState, useEffect } from "react";
import { 
  IconPlus, 
  IconEdit, 
  IconTrash, 
  IconCalendarEvent,
  IconSchool,
  IconX,
  IconCheck,
  IconAlertCircle,
  IconCircleCheck
} from "@tabler/icons-react";
import { NavbarSimple } from "./adminsidebar";
import { authenticatedFetch } from "../../utils/auth";

export default function SemesterManagement() {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [formData, setFormData] = useState({
    schoolYear: "",
    term: "1st"
  });
  const [submitting, setSubmitting] = useState(false);
  
  // Notification state
  const [notification, setNotification] = useState({
    show: false,
    type: '', // 'success' or 'error'
    title: '',
    message: ''
  });

  // Confirmation modal state
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null
  });

  // Fetch semesters
  useEffect(() => {
    fetchSemesters();
  }, []);

  // Notification helpers
  const showNotification = (type, title, message) => {
    setNotification({
      show: true,
      type,
      title,
      message
    });
  };

  const hideNotification = () => {
    setNotification({
      show: false,
      type: '',
      title: '',
      message: ''
    });
  };

  // Confirmation dialog helpers
  const   showConfirmDialog = (title, message, onConfirm) => {
    setConfirmDialog({
      show: true,
      title,
      message,
      onConfirm
    });
  };

  const hideConfirmDialog = () => {
    setConfirmDialog({
      show: false,
      title: '',
      message: '',
      onConfirm: null
    });
  };

  const fetchSemesters = async () => {
    try {
      setLoading(true);
      const res = await authenticatedFetch("http://localhost:5000/api/admin/semesters");
      if (res.ok) {
        const data = await res.json();
        setSemesters(data.semesters || []);
      } else {
        showNotification('error', 'Error', 'Failed to fetch semesters');
      }
    } catch (err) {
      showNotification('error', 'Error', 'There was an error processing your request.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = selectedSemester 
        ? `http://localhost:5000/api/admin/semesters/${selectedSemester._id}`
        : "http://localhost:5000/api/admin/semesters";
      
      const method = selectedSemester ? "PUT" : "POST";
      
      const res = await authenticatedFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchSemesters();
        resetForm();
        setShowAddModal(false);
        setShowEditModal(false);
        showNotification('success', 'Success', 
          selectedSemester ? 'Semester updated successfully!' : 'Semester added successfully!');
      } else {
        const data = await res.json();
        showNotification('error', 'Error', data.message || 'Failed to save semester');
      }
    } catch (err) {
      showNotification('error', 'Error', 'There was an error processing your request.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (semesterId) => {
    showConfirmDialog(
      'Delete Semester',
      'Are you sure you want to delete this semester? This action cannot be undone.',
      async () => {
        try {
          const res = await authenticatedFetch(`http://localhost:5000/api/admin/semesters/${semesterId}`, {
            method: "DELETE",
          });

          if (res.ok) {
            await fetchSemesters();
            showNotification('success', 'Success', 'Semester deleted successfully!');
          } else {
            const data = await res.json();
            showNotification('error', 'Error', data.message || 'Failed to delete semester');
          }
        } catch (err) {
          showNotification('error', 'Error', 'There was an error processing your request.');
          console.error(err);
        }
        hideConfirmDialog();
      }
    );
  };

  const resetForm = () => {
    setFormData({
      schoolYear: "",
      term: "1st"
    });
    setSelectedSemester(null);
  };

  const openEditModal = (semester) => {
    setSelectedSemester(semester);
    setFormData({
      schoolYear: semester.schoolYear,
      term: semester.term
    });
    setShowEditModal(true);
  };

  const generateSchoolYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const options = [];
    
    for (let i = 0; i < 10; i++) {
      const startYear = currentYear - 2 + i;
      const endYear = startYear + 1;
      options.push(`${startYear}-${endYear}`);
    }
    
    return options;
  };

  const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <IconX size={20} />
            </button>
          </div>
          {children}
        </div>
      </div>
    );
  };

  const NotificationModal = ({ isOpen, onClose, type, title, message }) => {
    if (!isOpen) return null;

    const isSuccess = type === 'success';
    const iconColor = isSuccess ? 'text-green-500' : 'text-red-500';
    const bgColor = isSuccess ? 'bg-green-50' : 'bg-red-50';
    const buttonColor = isSuccess ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700';

    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <div className="text-center">
            <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${bgColor} mb-4`}>
              {isSuccess ? (
                <IconCircleCheck className={iconColor} size={24} />
              ) : (
                <IconX className={iconColor} size={24} />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={onClose}
              className={`w-full text-white px-4 py-2 rounded-lg transition-colors ${buttonColor}`}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ConfirmationModal = ({ isOpen, onClose, title, message, onConfirm }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-50 mb-4">
              <IconAlertCircle className="text-red-500" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <NavbarSimple />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="pt-4 sm:pt-6 md:pt-4 lg:pt-6 font-outfit text-[#1E3A5F] text-xl sm:text-2xl lg:text-3xl font-bold">
              Semester Management
            </h2>
            <p className="text-gray-600 mt-1">Manage academic semesters and terms</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <IconPlus size={20} />
            Add Semester
          </button>
        </div>

        {/* Semesters Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {semesters.map((semester) => (
              <div
                key={semester._id}
                className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <IconCalendarEvent className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {semester.schoolYear}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {semester.term} Semester
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(semester)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <IconEdit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(semester._id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <IconTrash size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="text-sm text-gray-500">
                  Created: {new Date(semester.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
            
            {semesters.length === 0 && (
              <div className="col-span-full text-center py-12">
                <IconSchool className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No semesters found</h3>
                <p className="text-gray-500">Get started by adding your first semester</p>
              </div>
            )}
          </div>
        )}

        {/* Add Semester Modal */}
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add New Semester"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School Year
              </label>
              <input
                type="text"
                list="schoolYearOptions"
                value={formData.schoolYear}
                onChange={(e) => setFormData({ ...formData, schoolYear: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent  focus:outline-none"
                placeholder="Enter or select school year (e.g., 2023-2024)"
                required
              />
              <datalist id="schoolYearOptions">
                {generateSchoolYearOptions().map((year) => (
                  <option key={year} value={year} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Term
              </label>
              <select
                value={formData.term}
                onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="1st">1st Semester</option>
                <option value="2nd">2nd Semester</option>
                <option value="Summer">Summer</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <IconCheck size={16} />
                    Add Semester
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* Edit Semester Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Semester"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School Year
              </label>
              <select
                value={formData.schoolYear}
                onChange={(e) => setFormData({ ...formData, schoolYear: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select School Year</option>
                {generateSchoolYearOptions().map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Term
              </label>
              <select
                value={formData.term}
                onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="1st">1st Semester</option>
                <option value="2nd">2nd Semester</option>
                <option value="Summer">Summer</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <IconCheck size={16} />
                    Update Semester
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* Notification Modal */}
        <NotificationModal
          isOpen={notification.show}
          onClose={hideNotification}
          type={notification.type}
          title={notification.title}
          message={notification.message}
        />

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmDialog.show}
          onClose={hideConfirmDialog}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
        />
      </div>
    </div>
  );
}
