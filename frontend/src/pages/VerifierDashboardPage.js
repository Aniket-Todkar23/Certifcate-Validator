import React from 'react';
import { 
  ShieldCheckIcon,
  DocumentMagnifyingGlassIcon,
  SparklesIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import Header from '../components/Header';
import CertificateValidator from '../components/CertificateValidator';

const VerifierDashboardPage = ({ user }) => {
  return (
    <>
      <Header 
        title="Certificate Verifier Dashboard"
        subtitle="Verify Document Authenticity"
        description="Upload and verify certificates using advanced OCR and validation technology"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-100 flex items-center">
            <DocumentMagnifyingGlassIcon className="w-6 h-6 inline mr-2" />
            Welcome, {user?.full_name || 'Verifier'}
          </h2>
          <div className="text-slate-400 flex items-center">
            <ShieldCheckIcon className="w-5 h-5 mr-2" />
            Verifier Access
          </div>
        </div>

        {/* Quick Stats for Verifier */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600">
            <div className="flex items-center justify-center w-12 h-12 bg-white/25 backdrop-blur-sm rounded-xl mb-4">
              <DocumentMagnifyingGlassIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">Verify</h3>
            <h5 className="text-lg font-semibold text-white/95 mb-2">Certificates</h5>
            <p className="text-white/85 text-sm">Upload documents for verification</p>
          </div>

          <div className="glass-card p-6 bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600">
            <div className="flex items-center justify-center w-12 h-12 bg-white/25 backdrop-blur-sm rounded-xl mb-4">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">OCR</h3>
            <h5 className="text-lg font-semibold text-white/95 mb-2">Extraction</h5>
            <p className="text-white/85 text-sm">AI-powered data extraction</p>
          </div>

          <div className="glass-card p-6 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600">
            <div className="flex items-center justify-center w-12 h-12 bg-white/25 backdrop-blur-sm rounded-xl mb-4">
              <ClockIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">Real-time</h3>
            <h5 className="text-lg font-semibold text-white/95 mb-2">Results</h5>
            <p className="text-white/85 text-sm">Instant verification results</p>
          </div>
        </div>

        {/* Main Certificate Validator Component */}
        <CertificateValidator userRole="verifier" />
      </div>
    </>
  );
};

export default VerifierDashboardPage;