'use client';

import { useState, useEffect } from 'react';
import { 
  Atom, Play, Pause, RotateCcw, Save, Share2, Users, 
  FlaskConical, LineChart, Settings, FileText, Sparkles,
  TrendingUp, Zap, Layers, Binary
} from 'lucide-react';

interface ExperimentParameter {
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
  description: string;
}

interface CCCParameters {
  layers: number;
  coherenceThreshold: number;
  entropyBudget: number;
  boundaryCondition: 'open' | 'closed' | 'periodic';
  spectralWindowWidth: number;
  transferCoefficient: number;
}

interface ExperimentRun {
  id: string;
  runNumber: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  inputData: unknown;
  outputData?: unknown;
  metrics?: {
    coherenceScore: number;
    entropyChange: number;
    informationFlow: number;
    boundaryRecord: number;
  };
  duration?: number;
  startedAt: Date;
  completedAt?: Date;
}

export default function PhysicsLab() {
  const [activeTab, setActiveTab] = useState<'design' | 'run' | 'analyze' | 'collaborate'>('design');
  const [isRunning, setIsRunning] = useState(false);
  const [experiments, setExperiments] = useState<ExperimentRun[]>([]);
  const [currentRun, setCurrentRun] = useState<number>(1);
  
  const [cccParams, setCCCParams] = useState<CCCParameters>({
    layers: 99,
    coherenceThreshold: 0.75,
    entropyBudget: 1.0,
    boundaryCondition: 'closed',
    spectralWindowWidth: 0.1,
    transferCoefficient: 0.85,
  });

  const [hypothesis, setHypothesis] = useState('');
  const [methodology, setMethodology] = useState('');

  const runExperiment = async () => {
    setIsRunning(true);
    
    const newRun: ExperimentRun = {
      id: `run-${Date.now()}`,
      runNumber: currentRun,
      status: 'running',
      inputData: { ...cccParams, hypothesis, methodology },
      startedAt: new Date(),
    };
    
    setExperiments(prev => [newRun, ...prev]);

    // Simulate CCC calculation
    setTimeout(() => {
      const coherenceScore = calculateCoherence(cccParams);
      const entropyChange = calculateEntropyChange(cccParams);
      const informationFlow = calculateInformationFlow(cccParams);
      const boundaryRecord = calculateBoundaryRecord(cccParams);

      const completedRun: ExperimentRun = {
        ...newRun,
        status: 'completed',
        outputData: {
          layerOutputs: generateLayerOutputs(cccParams.layers),
          waveform: generateWaveform(),
          spectralData: generateSpectralData(),
        },
        metrics: {
          coherenceScore,
          entropyChange,
          informationFlow,
          boundaryRecord,
        },
        duration: Math.random() * 5000 + 2000,
        completedAt: new Date(),
      };

      setExperiments(prev => 
        prev.map(exp => exp.id === newRun.id ? completedRun : exp)
      );
      setIsRunning(false);
      setCurrentRun(prev => prev + 1);
    }, 3000);
  };

  // CCC calculation functions
  const calculateCoherence = (params: CCCParameters): number => {
    // Simplified coherence calculation across 99 layers
    const layerCoherence = params.layers / 99;
    const thresholdFactor = params.coherenceThreshold;
    const transferImpact = params.transferCoefficient;
    
    return Math.min(0.95, layerCoherence * thresholdFactor * transferImpact);
  };

  const calculateEntropyChange = (params: CCCParameters): number => {
    // CCC treats entropy as redistribution, not loss
    const boundaryEffect = params.boundaryCondition === 'closed' ? 1.0 : 0.8;
    const budgetUtilization = params.entropyBudget;
    
    return boundaryEffect * budgetUtilization * (Math.random() * 0.4 + 0.6);
  };

  const calculateInformationFlow = (params: CCCParameters): number => {
    // Information flows through layers with transfer coefficient
    const flowRate = params.transferCoefficient;
    const layerResistance = 1 / params.layers;
    
    return flowRate * (1 - layerResistance) * (Math.random() * 0.3 + 0.7);
  };

  const calculateBoundaryRecord = (params: CCCParameters): number => {
    // Boundary records increase as information reaches junction
    const junctionStrength = params.boundaryCondition === 'closed' ? 1.0 : 0.6;
    const recordingFidelity = params.spectralWindowWidth;
    
    return junctionStrength * (1 + recordingFidelity) * (Math.random() * 0.2 + 0.8);
  };

  const generateLayerOutputs = (layers: number) => {
    return Array.from({ length: Math.min(layers, 99) }, (_, i) => ({
      layer: i + 1,
      activation: Math.random() * 0.5 + 0.5,
      coherence: Math.random() * 0.3 + 0.7,
      entropy: Math.random() * 0.4 + 0.3,
    }));
  };

  const generateWaveform = () => {
    return Array.from({ length: 100 }, (_, i) => ({
      x: i,
      y: Math.sin(i * 0.1) * Math.exp(-i * 0.01) + Math.random() * 0.1,
    }));
  };

  const generateSpectralData = () => {
    return Array.from({ length: 50 }, (_, i) => ({
      frequency: i * 0.5,
      amplitude: Math.random() * Math.exp(-i * 0.05),
      phase: Math.random() * Math.PI * 2,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl">
                <FlaskConical className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  Physics Laboratory
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Explore Confirmed Connected Chaos (CCC) Framework
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <Users className="w-4 h-4" />
                <span>Collaborate</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors shadow-lg">
                <Save className="w-4 h-4" />
                <span>Save Experiment</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-2 flex gap-2">
          {(['design', 'run', 'analyze', 'collaborate'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  CCC Parameters
                </h2>
              </div>

              <div className="space-y-6">
                {/* Layers */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Layers className="w-4 h-4" />
                    Number of Layers
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="99"
                    value={cccParams.layers}
                    onChange={(e) => setCCCParams(prev => ({ ...prev, layers: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>1</span>
                    <span className="font-bold text-blue-600">{cccParams.layers}</span>
                    <span>99</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    99 layers approximate RG-like log-uniform discretization
                  </p>
                </div>

                {/* Coherence Threshold */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Sparkles className="w-4 h-4" />
                    Coherence Threshold
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={cccParams.coherenceThreshold}
                    onChange={(e) => setCCCParams(prev => ({ ...prev, coherenceThreshold: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>0.0</span>
                    <span className="font-bold text-purple-600">{cccParams.coherenceThreshold.toFixed(2)}</span>
                    <span>1.0</span>
                  </div>
                </div>

                {/* Entropy Budget */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Zap className="w-4 h-4" />
                    Entropy Budget
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={cccParams.entropyBudget}
                    onChange={(e) => setCCCParams(prev => ({ ...prev, entropyBudget: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>0.0</span>
                    <span className="font-bold text-indigo-600">{cccParams.entropyBudget.toFixed(1)}</span>
                    <span>2.0</span>
                  </div>
                </div>

                {/* Boundary Condition */}
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    Boundary Condition
                  </label>
                  <select
                    value={cccParams.boundaryCondition}
                    onChange={(e) => setCCCParams(prev => ({ ...prev, boundaryCondition: e.target.value as unknown }))}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <option value="closed">Closed (Full Ledger)</option>
                    <option value="open">Open (Partial)</option>
                    <option value="periodic">Periodic</option>
                  </select>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Closed: Information conserved at boundary
                  </p>
                </div>

                {/* Transfer Coefficient */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Binary className="w-4 h-4" />
                    Transfer Coefficient
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={cccParams.transferCoefficient}
                    onChange={(e) => setCCCParams(prev => ({ ...prev, transferCoefficient: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>0.0</span>
                    <span className="font-bold text-green-600">{cccParams.transferCoefficient.toFixed(2)}</span>
                    <span>1.0</span>
                  </div>
                </div>
              </div>

              {/* Run Button */}
              <button
                onClick={runExperiment}
                disabled={isRunning}
                className={`w-full mt-8 px-6 py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-3 ${
                  isRunning
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl hover:scale-105'
                }`}
              >
                {isRunning ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Running Simulation...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    <span>Run Experiment #{currentRun}</span>
                  </>
                )}
              </button>
            </div>

            {/* Hypothesis & Methodology */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Research Notes
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    Hypothesis
                  </label>
                  <textarea
                    value={hypothesis}
                    onChange={(e) => setHypothesis(e.target.value)}
                    placeholder="What are you testing?"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    Methodology
                  </label>
                  <textarea
                    value={methodology}
                    onChange={(e) => setMethodology(e.target.value)}
                    placeholder="How will you test it?"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Metrics */}
            {experiments.length > 0 && experiments[0].metrics && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Coherence Score', value: experiments[0].metrics.coherenceScore, icon: Sparkles, color: 'blue' },
                  { label: 'Entropy Change', value: experiments[0].metrics.entropyChange, icon: Zap, color: 'purple' },
                  { label: 'Information Flow', value: experiments[0].metrics.informationFlow, icon: TrendingUp, color: 'green' },
                  { label: 'Boundary Record', value: experiments[0].metrics.boundaryRecord, icon: Layers, color: 'indigo' },
                ].map((metric) => (
                  <div key={metric.label} className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <metric.icon className={`w-4 h-4 text-${metric.color}-600`} />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {metric.label}
                      </span>
                    </div>
                    <div className={`text-2xl font-bold text-${metric.color}-600`}>
                      {(metric.value * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Visualization Area */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <LineChart className="w-5 h-5 text-blue-600" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Real-Time Visualization
                </h3>
              </div>

              <div className="h-64 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700">
                {experiments.length === 0 ? (
                  <p className="text-slate-500 dark:text-slate-400">
                    Run an experiment to see visualizations
                  </p>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-600 dark:text-slate-300">
                      Generating coherence maps...
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Experiment History */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                Experiment History
              </h3>

              <div className="space-y-3">
                {experiments.length === 0 ? (
                  <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                    No experiments run yet. Configure parameters and click Run!
                  </p>
                ) : (
                  experiments.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            exp.status === 'completed' ? 'bg-green-500' :
                            exp.status === 'running' ? 'bg-blue-500 animate-pulse' :
                            exp.status === 'failed' ? 'bg-red-500' :
                            'bg-slate-400'
                          }`} />
                          <span className="font-medium text-slate-900 dark:text-white">
                            Run #{exp.runNumber}
                          </span>
                          {exp.metrics && (
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              Coherence: {(exp.metrics.coherenceScore * 100).toFixed(1)}%
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">
                          {exp.startedAt.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
