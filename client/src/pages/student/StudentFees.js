import React, { useState } from 'react';
import { 
  CurrencyDollarIcon, 
  CreditCardIcon, 
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const StudentFees = () => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

  const feeStructure = [
    {
      type: 'Tuition Fee',
      amount: 75000,
      paid: 75000,
      due: 0,
      status: 'paid',
      dueDate: '2024-01-15'
    },
    {
      type: 'Hostel Fee',
      amount: 25000,
      paid: 25000,
      due: 0,
      status: 'paid',
      dueDate: '2024-01-15'
    },
    {
      type: 'Library Fee',
      amount: 2000,
      paid: 2000,
      due: 0,
      status: 'paid',
      dueDate: '2024-01-15'
    },
    {
      type: 'Lab Fee',
      amount: 5000,
      paid: 2500,
      due: 2500,
      status: 'partial',
      dueDate: '2024-03-31'
    },
    {
      type: 'Examination Fee',
      amount: 3000,
      paid: 0,
      due: 3000,
      status: 'pending',
      dueDate: '2024-04-15'
    }
  ];

  const paymentHistory = [
    {
      date: '2024-01-10',
      description: 'Tuition Fee - Semester 6',
      amount: 75000,
      method: 'Online Banking',
      transactionId: 'TXN123456789',
      status: 'success'
    },
    {
      date: '2024-01-10',
      description: 'Hostel Fee - Semester 6',
      amount: 25000,
      method: 'UPI',
      transactionId: 'UPI987654321',
      status: 'success'
    },
    {
      date: '2024-01-12',
      description: 'Library Fee - Annual',
      amount: 2000,
      method: 'Card Payment',
      transactionId: 'CARD456789123',
      status: 'success'
    },
    {
      date: '2024-02-15',
      description: 'Lab Fee - Partial Payment',
      amount: 2500,
      method: 'Online Banking',
      transactionId: 'TXN789123456',
      status: 'success'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      case 'partial':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
      case 'pending':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      case 'overdue':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const totalAmount = feeStructure.reduce((sum, fee) => sum + fee.amount, 0);
  const totalPaid = feeStructure.reduce((sum, fee) => sum + fee.paid, 0);
  const totalDue = feeStructure.reduce((sum, fee) => sum + fee.due, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Fee Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your fee payments and due amounts
          </p>
        </div>
      </div>

      {/* Fee Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
              <CurrencyDollarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Fee
              </p>
              <p className="text-2xl font-bold text-blue-600">₹{totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900">
              <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Amount Paid
              </p>
              <p className="text-2xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Amount Due
              </p>
              <p className="text-2xl font-bold text-red-600">₹{totalDue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900">
              <CreditCardIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Payment Rate
              </p>
              <p className="text-2xl font-bold text-purple-600">
                {((totalPaid / totalAmount) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Fee Structure */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Current Semester Fee Structure
            </h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Fee Type</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">Total</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">Paid</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">Due</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">Status</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {feeStructure.map((fee, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{fee.type}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Due: {new Date(fee.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="text-center py-4 px-4 text-gray-900 dark:text-white">
                        ₹{fee.amount.toLocaleString()}
                      </td>
                      <td className="text-center py-4 px-4 text-green-600">
                        ₹{fee.paid.toLocaleString()}
                      </td>
                      <td className="text-center py-4 px-4 text-red-600">
                        ₹{fee.due.toLocaleString()}
                      </td>
                      <td className="text-center py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(fee.status)}`}>
                          {fee.status}
                        </span>
                      </td>
                      <td className="text-center py-4 px-4">
                        {fee.due > 0 ? (
                          <button className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded text-sm">
                            Pay Now
                          </button>
                        ) : (
                          <span className="text-green-600 text-sm">✓ Paid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {totalDue > 0 && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-red-800 dark:text-red-200">Outstanding Amount</h4>
                    <p className="text-red-600 dark:text-red-400">Total due: ₹{totalDue.toLocaleString()}</p>
                  </div>
                  <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium">
                    Pay All Due
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment History & Quick Pay */}
        <div className="space-y-6">
          {/* Quick Payment */}
          {totalDue > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Payment
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="form-label">Payment Method</label>
                  <select 
                    value={selectedPaymentMethod}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className="form-input"
                  >
                    <option value="">Select payment method</option>
                    <option value="upi">UPI</option>
                    <option value="netbanking">Net Banking</option>
                    <option value="card">Debit/Credit Card</option>
                    <option value="wallet">Digital Wallet</option>
                  </select>
                </div>
                
                <div>
                  <label className="form-label">Amount</label>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    className="form-input"
                    defaultValue={totalDue}
                  />
                </div>
                
                <button 
                  className="w-full btn-primary"
                  disabled={!selectedPaymentMethod}
                >
                  Proceed to Pay
                </button>
              </div>
            </div>
          )}

          {/* Payment History */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Payments
            </h3>
            
            <div className="space-y-3">
              {paymentHistory.slice(0, 5).map((payment, index) => (
                <div key={index} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {payment.description}
                    </h4>
                    <span className="text-sm font-bold text-green-600">
                      ₹{payment.amount.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{new Date(payment.date).toLocaleDateString()}</span>
                    <span>{payment.method}</span>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    ID: {payment.transactionId}
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-4 text-center text-primary-600 dark:text-primary-400 hover:text-primary-500 text-sm font-medium">
              View All Payments
            </button>
          </div>

          {/* Download Section */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Documents
            </h3>
            
            <div className="space-y-3">
              <button className="w-full flex items-center justify-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Download Fee Receipt</span>
              </button>
              
              <button className="w-full flex items-center justify-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Download Fee Structure</span>
              </button>
              
              <button className="w-full flex items-center justify-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Download Payment History</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentFees;