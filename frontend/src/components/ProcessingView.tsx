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
  { key: 'Extracting', label: 'Extracting Claims', icon: FileText, color: 'text-foreground', activeColor: 'border-foreground' },
  { key: 'Searching', label: 'Searching Sources', icon: Search, color: 'text-foreground', activeColor: 'border-foreground' },
  { key: 'Verifying', label: 'Verifying Claims', icon: Shield, color: 'text-foreground', activeColor: 'border-foreground' },
  { key: 'Completed', label: 'Complete', icon: CheckCircle, color: 'text-emerald-800', activeColor: 'border-emerald-800' },
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
        <h2 className="text-3xl font-black text-foreground uppercase tracking-tight">
          {isCompleted ? 'Verification Complete' : 'Analyzing...'}
        </h2>
        <p className="text-foreground/60 text-sm italic">
          {isCompleted
            ? `Found ${latestUpdate.total_claims || 0} claims to verify`
            : 'Our agents are cross-referencing your content against primary sources'
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
                <span className="text-foreground/70 font-medium">{latestUpdate.message}</span>
                <span className="text-foreground/50 font-bold">{Math.round(latestUpdate.progress * 100)}%</span>
              </div>
              <Progress value={latestUpdate.progress * 100} className="h-1.5 bg-muted border border-foreground rounded-none" />
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
                  className={`flex items-center gap-3 p-3 transition-all duration-300 ${
                    isActive ? 'bg-muted border-l-4 border-foreground' : isDone ? 'bg-transparent' : 'bg-transparent opacity-40'
                  }`}
                >
                  <div className={`w-8 h-8 flex items-center justify-center border-2 transition-all ${
                    isDone ? 'border-emerald-800 bg-emerald-50'
                    : isActive ? `${stage.activeColor} bg-muted`
                    : 'border-foreground/30 bg-background'
                  }`}>
                    {isActive && !isDone
                      ? <Loader2 className="h-4 w-4 text-foreground animate-spin" />
                      : isDone
                      ? <CheckCircle className="h-4 w-4 text-emerald-800" />
                      : <Icon className="h-3.5 w-3.5 text-foreground/40" />
                    }
                  </div>
                  <span className={`text-sm font-bold uppercase tracking-wide ${
                    isActive ? 'text-foreground' : isDone ? 'text-foreground/60' : 'text-foreground/40'
                  }`}>
                    {stage.label}
                  </span>
                  {isDone && (
                    <span className="ml-auto text-[10px] text-emerald-800 font-black uppercase">Done</span>
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
            className="text-foreground/60 hover:text-foreground font-bold uppercase"
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}