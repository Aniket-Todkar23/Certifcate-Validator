import React, { useState } from 'react';
import { 
  ChevronDownIcon,
  ChevronUpIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "What is the Certificate Authenticity Validator?",
      answer: "The Certificate Authenticity Validator is a secure digital platform developed by the Government of Jharkhand to verify the authenticity of educational certificates. It uses advanced AI technology and OCR to detect fraudulent documents and cross-verify with official institution records."
    },
    {
      question: "Who can use this verification system?",
      answer: "This system is primarily designed for authorized verifiers such as employers, educational institutions, and government agencies. Public access is limited to viewing general information. To perform certificate verification, you need to be registered as an authorized verifier."
    },
    {
      question: "What types of certificates can be verified?",
      answer: "The system can verify various educational certificates including graduation certificates, diplomas, mark sheets, and other academic credentials issued by institutions in Jharkhand. Supported file formats include PDF, JPG, PNG, GIF, BMP, and TIFF files up to 16MB."
    },
    {
      question: "How accurate is the verification process?",
      answer: "Our AI-powered verification system uses advanced machine learning algorithms to achieve high accuracy in detecting fraudulent certificates. The system provides a confidence score and detailed analysis of each document, including extracted information and potential anomalies."
    },
    {
      question: "How long does the verification process take?",
      answer: "The verification process typically takes just a few seconds. Our system provides instant results with comprehensive analysis including confidence scores, extracted information, and detailed recommendations."
    },
    {
      question: "Is my data secure when using this system?",
      answer: "Yes, data security is our top priority. All uploaded documents are processed securely, and we follow strict data protection protocols. Personal information is handled in accordance with government privacy guidelines and is never shared with unauthorized parties."
    },
    {
      question: "How do I become an authorized verifier?",
      answer: "To become an authorized verifier, you need to contact the relevant government department or educational authority in Jharkhand. The registration process involves identity verification and approval from the appropriate authorities."
    },
    {
      question: "What should I do if I suspect a certificate is fraudulent?",
      answer: "If you suspect a certificate is fraudulent, you should report it to the relevant educational authorities or the issuing institution. Our system provides detailed analysis that can help in such investigations, but final determination should always involve the appropriate authorities."
    },
    {
      question: "Can I verify certificates from institutions outside Jharkhand?",
      answer: "Currently, this system is specifically designed for verifying certificates issued by institutions within Jharkhand. For certificates from other states or countries, please contact the respective verification authorities."
    },
    {
      question: "What if the verification shows an error or unexpected result?",
      answer: "If you encounter any errors or unexpected results, please contact the system administrators or the issuing institution directly. Technical issues can sometimes occur, and manual verification may be required in certain cases."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto my-12">
      <div className="glass-card">
        <div className="bg-slate-700/50 px-6 py-4 border-b border-slate-600/30 flex items-center gap-2 font-semibold text-slate-100">
          <QuestionMarkCircleIcon className="w-5 h-5" />
          Frequently Asked Questions
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-slate-600/30 rounded-lg overflow-hidden bg-slate-700/30">
                <button
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-600/50 transition-colors"
                  onClick={() => toggleFAQ(index)}
                >
                  <span className="text-slate-100 font-medium pr-4">{faq.question}</span>
                  {openIndex === index ? (
                    <ChevronUpIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronDownIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-4 pt-2 border-t border-slate-600/30 bg-slate-800/30">
                    <p className="text-slate-300 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/20 rounded-lg backdrop-blur-md">
            <h3 className="text-lg font-semibold text-blue-400 mb-2">Need to Verify a Certificate?</h3>
            <p className="text-slate-300 mb-4">
              If you're an authorized verifier, please log in to access the certificate verification system.
            </p>
            <a 
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/30 btn-glow"
            >
              Login as Verifier
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;