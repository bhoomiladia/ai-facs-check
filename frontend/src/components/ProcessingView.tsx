'use client'

import React from 'react'
import { ProcessingUpdate } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Search,
  FileText,
  Shield,
  CheckCircle,
  Loader2,
  X
} from 'lucide-react'

interface ProcessingViewProps {
  updates: ProcessingUpdate[]
  onCancel: () => void
}

const stages = [
  { key: 'Extracting', label: 'Extracting Claims', icon: FileText, color: 'text-blue-400', activeColor: 'border-blue-500' },
  { key: 'Searching', label: 'Searching Sources', icon: Search, color: 'text-yellow-400', activeColor: 'border-yellow-500' },
  { key: 'Verifying', label: 'Verifying Claims', icon: Shield, color: 'text-purple-400', activeColor: 'border-purple-500' },
  { key: 'Completed', label: 'Complete', icon: CheckCircle, color: 'text-green-400', activeColor: 'border-green-500' },
] as const

export function ProcessingView({ updates, onCancel }: ProcessingViewProps) {
  const latestUpdate = updates[updates.length - 1]
  const isCompleted = latestUpdate?.stage === 'Completed'

  const getStageState = (stageKey: string) => {
    const stageUpdate = updates.find(u => u.stage === stageKey)
    const isActive = latestUpdate?.stage === stageKey
    const isDone = stageUpdate && !isActive
    return { isActive, isDone, stageUpdate }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-slide-up">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">
          {isCompleted ? 'Verification Complete' : 'Analyzing...'}
        </h2>
        <p className="text-slate-500 text-sm">
          {isCompleted
            ? `Found ${latestUpdate.total_claims || 0} claims to verify`
            : 'Our AI agents are cross-referencing your content'
          }
        </p>
      </div>

      {/* Stepper Card */}
      <Card className="panel">
        <CardContent className="pt-6 pb-5">
          {/* Progress bar */}
          {latestUpdate && (
            <div className="mb-6">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-400">{latestUpdate.message}</span>
                <span className="text-slate-500">{Math.round(latestUpdate.progress * 100)}%</span>
              </div>
              <Progress value={latestUpdate.progress * 100} className="h-1.5 bg-slate-800" />
            </div>
          )}

          {/* Stepper */}
          <div className="space-y-1">
            {stages.map((stage, index) => {
              const { isActive, isDone } = getStageState(stage.key)
              const Icon = stage.icon

              return (
                <div
                  key={stage.key}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                    isActive ? 'bg-slate-800/60' : isDone ? 'bg-transparent' : 'bg-transparent opacity-40'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                    isDone ? 'border-green-500/50 bg-green-500/10'
                    : isActive ? `${stage.activeColor} bg-slate-800`
                    : 'border-slate-700 bg-slate-800/50'
                  }`}>
                    {isActive && !isDone
                      ? <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                      : isDone
                      ? <CheckCircle className="h-4 w-4 text-green-400" />
                      : <Icon className="h-3.5 w-3.5 text-slate-600" />
                    }
                  </div>
                  <span className={`text-sm font-medium ${
                    isActive ? 'text-white' : isDone ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {stage.label}
                  </span>
                  {isDone && (
                    <span className="ml-auto text-[10px] text-green-500 font-medium">Done</span>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Cancel */}
      {!isCompleted && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-slate-500 hover:text-slate-300"
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}