// frontend/src/apps/trackandtrace/pages/DistributionKiosk/components/StepIndicator.jsx

export default function StepIndicator({ steps, currentStep, isCompleted }) {
  return (
    <div className="step-indicator">
      {steps.map((step, index) => {
        let stepClass = 'step-item'
        
        if (isCompleted || index < currentStep) {
          stepClass += ' completed'
        } else if (index === currentStep) {
          stepClass += ' active'
        } else {
          stepClass += ' inactive'
        }
        
        return (
          <div key={index} className={stepClass}>
            <div className="step-number">
              {isCompleted || index < currentStep ? '✓' : index + 1}
            </div>
            <div className="step-label">{step}</div>
          </div>
        )
      })}
    </div>
  )
}