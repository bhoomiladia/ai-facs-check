'use client'

import React from 'react'
import { ProcessingUpdate } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  FileText, 
  Shield, 
  CheckCircle, 
  Loader2, 
  X,
  Clock
} from 'lucide-react'

interface ProcessingViewProps {
  updates: ProcessingUpdate[]
  onCancel: () => void
}

const stageIcons = {
  'Extracting': FileText,
  'Searching': Search,
  'Verifying': Shield,
  'Completed': CheckCircle
}

const stageColors = {
  'Extracting': 'text-blue-400',
  'Searching': 'text-yellow-400', 
  'Verifying': 'text-purple-400',
  'Completed': 'text-green-400'
}

export function ProcessingView({ updates, onCancel }: ProcessingViewProps) {
  const latestUpdate = updates[updates.length - 1]
  const isCompleted = latestUpdate?.stage === 'Completed'
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white">
          {isCompleted ? 'Verification Complete!' : 'Processing Your Request'}
        </h2>
        <p className="text-slate-400">
          {isCompleted 
            ? 'All claims have been analyzed and verified'
            : 'AI agents are working to extract and verify claims...'
          }
        </p>
      </div>

      {/* Main Progress Card */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              {latestUpdate && (
                <>
                  {React.createElement(stageIcons[latestUpdate.stage], {
                    className: `h-5 w-5 ${stageColors[latestUpdate.stage]} ${!isCompleted ? 'animate-pulse' : ''}`
                  })}
                  {latestUpdate.stage}
                </>
              )}
            </CardTitle>
            {!isCompleted && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="border-slate-600 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          {latestUpdate && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">{latestUpdate.message}</span>
                <span className="text-slate-400">
                  {Math.round(latestUpdate.progress * 100)}%
                </span>
              </div>
              <Progress 
                value={latestUpdate.progress * 100} 
                className="h-2 bg-slate-800"
              />
              {latestUpdate.claims_processed !== undefined && latestUpdate.total_claims && (
                <div className="flex justify-between text-xs text-slate-500">
                  <span>
                    Claims processed: {latestUpdate.claims_processed} / {latestUpdate.total_claims}
                  </span>
                  <span>
                    {latestUpdate.total_claims - latestUpdate.claims_processed} remaining
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Stage Timeline */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-300 mb-3">Processing Stages</h4>
            <div className="space-y-2">
              {(['Extracting', 'Searching', 'Verifying', 'Completed'] as const).map((stage, index) => {
                const stageUpdate = updates.find(u => u.stage === stage)
                const isActive = latestUpdate?.stage === stage
                const isComplete = stageUpdate && stageUpdate.progress === 1.0
                const isPending = !stageUpdate && !isActive
                
                const Icon = stageIcons[stage]
                
                return (
                  <div
                    key={stage}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      isActive 
                        ? 'bg-slate-800 border border-slate-600' 
                        : isComplete
                        ? 'bg-slate-800/50'
                        : 'bg-slate-900'
                    }`}
                  >
                    <div className={`p-2 rounded-full ${
                      isComplete 
                        ? 'bg-green-500/20' 
                        : isActive 
                        ? 'bg-blue-500/20' 
                        : 'bg-slate-700'
                    }`}>
                      {isActive && !isComplete ? (
                        <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                      ) : (
                        <Icon className={`h-4 w-4 ${
                          isComplete 
                            ? 'text-green-400' 
                            : isActive 
                            ? 'text-blue-400' 
                            : 'text-slate-500'
                        }`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${
                          isComplete || isActive ? 'text-white' : 'text-slate-500'
                        }`}>
                          {stage}
                        </span>
                        {isComplete && (
                          <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                            Complete
                          </Badge>
                        )}
                        {isActive && !isComplete && (
                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                            Active
                          </Badge>
                        )}
                      </div>
                      {stageUpdate && (
                        <p className="text-sm text-slate-400 mt-1">
                          {stageUpdate.message}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Processing Stats */}
          {latestUpdate?.total_claims && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {latestUpdate.total_claims}
                </div>
                <div className="text-sm text-slate-400">Claims Found</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white flex items-center justify-center gap-1">
                  <Clock className="h-5 w-5" />
                  {Math.round((Date.now() - (updates[0]?.timestamp || Date.now())) / 1000)}s
                </div>
                <div className="text-sm text-slate-400">Processing Time</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {updates.map((update, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-2 rounded text-sm"
              >
                <div className={`p-1 rounded-full mt-0.5 ${
                  update.stage === 'Completed' ? 'bg-green-500/20' : 'bg-blue-500/20'
                }`}>
                  {React.createElement(stageIcons[update.stage], {
                    className: `h-3 w-3 ${stageColors[update.stage]}`
                  })}
                </div>
                <div className="flex-1">
                  <span className="text-slate-300">{update.message}</span>
                  <div className="text-xs text-slate-500 mt-1">
                    {update.stage} • {Math.round(update.progress * 100)}% complete
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}