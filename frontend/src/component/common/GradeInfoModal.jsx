import React from 'react';
import { IconX, IconInfoCircle } from '@tabler/icons-react';

const GradeInfoModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <IconInfoCircle className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              BukSU Grading System Information
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Algorithm Overview */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Grading Algorithm Steps</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Calculate component scores (Class Standing, Laboratory, Major Output) as percentages</li>
              <li>Calculate term grades (Midterm, Final) using weighted components</li>
              <li>Convert term percentages to equivalent grades using <strong>Table 1</strong></li>
              <li>Calculate weighted average of term grades (Midterm 40% + Final Term 60%)</li>
              <li>Convert final numeric grade to equivalent grade using <strong>Table 3</strong></li>
            </ol>
          </div>

          {/* Component Weights */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Component Weights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">With Laboratory</h4>
                <ul className="space-y-1 text-sm text-green-800">
                  <li>• Class Standing: <strong>30%</strong></li>
                  <li>• Laboratory: <strong>30%</strong></li>
                  <li>• Major Output: <strong>40%</strong></li>
                </ul>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <h4 className="font-medium text-orange-900 mb-2">Without Laboratory</h4>
                <ul className="space-y-1 text-sm text-orange-800">
                  <li>• Class Standing: <strong>60%</strong></li>
                  <li>• Major Output: <strong>40%</strong></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Grade Conversion Tables */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Grade Conversion Tables</h3>
            
            {/* Table 1 */}
            <div>
              <h4 className="font-medium text-gray-800 mb-2">
                Table 1: Grade Category Equivalency (50% Passing Rate)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
                <div className="bg-green-100 p-2 rounded text-center">
                  <div className="font-semibold">96-100%</div>
                  <div className="text-green-700">1.00 - Excellent</div>
                </div>
                <div className="bg-green-100 p-2 rounded text-center">
                  <div className="font-semibold">93-95%</div>
                  <div className="text-green-700">1.25 - Very Good</div>
                </div>
                <div className="bg-blue-100 p-2 rounded text-center">
                  <div className="font-semibold">89-92%</div>
                  <div className="text-blue-700">1.50 - Good</div>
                </div>
                <div className="bg-blue-100 p-2 rounded text-center">
                  <div className="font-semibold">86-88%</div>
                  <div className="text-blue-700">1.75 - Satisfactory</div>
                </div>
                <div className="bg-yellow-100 p-2 rounded text-center">
                  <div className="font-semibold">83-85%</div>
                  <div className="text-yellow-700">2.00 - Fair</div>
                </div>
                <div className="bg-yellow-100 p-2 rounded text-center">
                  <div className="font-semibold">80-82%</div>
                  <div className="text-yellow-700">2.25 - Fair</div>
                </div>
                <div className="bg-orange-100 p-2 rounded text-center">
                  <div className="font-semibold">77-79%</div>
                  <div className="text-orange-700">2.50 - Fair</div>
                </div>
                <div className="bg-orange-100 p-2 rounded text-center">
                  <div className="font-semibold">74-76%</div>
                  <div className="text-orange-700">2.75 - Fair</div>
                </div>
                <div className="bg-orange-100 p-2 rounded text-center">
                  <div className="font-semibold">71-73%</div>
                  <div className="text-orange-700">3.00 - Passing</div>
                </div>
                <div className="bg-red-100 p-2 rounded text-center">
                  <div className="font-semibold">68-70%</div>
                  <div className="text-red-700">3.25 - Failing</div>
                </div>
                <div className="bg-red-100 p-2 rounded text-center">
                  <div className="font-semibold">65-67%</div>
                  <div className="text-red-700">3.50 - Failing</div>
                </div>
                <div className="bg-red-100 p-2 rounded text-center">
                  <div className="font-semibold">60-64%</div>
                  <div className="text-red-700">3.75 - Failing</div>
                </div>
                <div className="bg-red-100 p-2 rounded text-center">
                  <div className="font-semibold">56-59%</div>
                  <div className="text-red-700">4.00 - Failing</div>
                </div>
                <div className="bg-red-100 p-2 rounded text-center">
                  <div className="font-semibold">50-55%</div>
                  <div className="text-red-700">4.50 - Failing</div>
                </div>
                <div className="bg-gray-100 p-2 rounded text-center">
                  <div className="font-semibold">&lt;50%</div>
                  <div className="text-gray-700">5.00 - Failed</div>
                </div>
              </div>
            </div>

            {/* Table 3 */}
            <div>
              <h4 className="font-medium text-gray-800 mb-2">
                Table 3: Final Grade Equivalency
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <div className="bg-green-100 p-2 rounded text-center">
                  <div className="font-semibold">0 - 1.1250</div>
                  <div className="text-green-700">1.00 - PASSED</div>
                </div>
                <div className="bg-green-100 p-2 rounded text-center">
                  <div className="font-semibold">1.1251 - 1.3750</div>
                  <div className="text-green-700">1.25 - PASSED</div>
                </div>
                <div className="bg-green-100 p-2 rounded text-center">
                  <div className="font-semibold">1.3751 - 1.6250</div>
                  <div className="text-green-700">1.50 - PASSED</div>
                </div>
                <div className="bg-green-100 p-2 rounded text-center">
                  <div className="font-semibold">1.6251 - 1.8750</div>
                  <div className="text-green-700">1.75 - PASSED</div>
                </div>
                <div className="bg-green-100 p-2 rounded text-center">
                  <div className="font-semibold">1.8751 - 2.1250</div>
                  <div className="text-green-700">2.00 - PASSED</div>
                </div>
                <div className="bg-green-100 p-2 rounded text-center">
                  <div className="font-semibold">2.1251 - 2.3750</div>
                  <div className="text-green-700">2.25 - PASSED</div>
                </div>
                <div className="bg-green-100 p-2 rounded text-center">
                  <div className="font-semibold">2.3751 - 2.6250</div>
                  <div className="text-green-700">2.50 - PASSED</div>
                </div>
                <div className="bg-green-100 p-2 rounded text-center">
                  <div className="font-semibold">2.6251 - 2.8750</div>
                  <div className="text-green-700">2.75 - PASSED</div>
                </div>
                <div className="bg-green-100 p-2 rounded text-center">
                  <div className="font-semibold">2.8751 - 3.1250</div>
                  <div className="text-green-700">3.00 - PASSED</div>
                </div>
                <div className="bg-red-100 p-2 rounded text-center">
                  <div className="font-semibold">3.1251 - 9.0000</div>
                  <div className="text-red-700">5.00 - FAILED</div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Changes */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">Key Updates in This System</h3>
            <ul className="space-y-1 text-sm text-yellow-800">
              <li>• <strong>50% passing threshold</strong> instead of previous 75%</li>
              <li>• <strong>Extended grade ranges</strong> including 3.25, 3.50, 3.75, 4.00, 4.50</li>
              <li>• <strong>Three-table conversion system</strong> for more accurate grading</li>
              <li>• <strong>Separate final grade table</strong> for final assessments</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GradeInfoModal;