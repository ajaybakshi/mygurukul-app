'use client';

import { X } from 'lucide-react';
import type { Scripture } from '@/types/library';

interface EditionsModalProps {
  isModalOpen: boolean;
  onClose: () => void;
  scripture: Scripture;
}

export default function EditionsModal({ isModalOpen, onClose, scripture }: EditionsModalProps) {
  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{scripture.title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Available Editions</h3>
          
          <div className="space-y-4">
            {scripture.editions.map((edition, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {edition['Edition Title']}
                    </h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Language:</span> {edition['Language']}
                      </p>
                      <p>
                        <span className="font-medium">Format:</span> {edition['Format']}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      const gcsPath = edition['GCS Path'];
                      if (gcsPath && typeof gcsPath === 'string') {
                        const publicUrl = gcsPath.replace('gs://', 'https://storage.googleapis.com/');
                        window.open(publicUrl, '_blank', 'noopener,noreferrer');
                      } else {
                        console.error('Invalid GCS Path for edition:', edition);
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>

          {scripture.editions.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              No editions available for this scripture.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

