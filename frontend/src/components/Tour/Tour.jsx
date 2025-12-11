import React, { useEffect } from 'react';
import Joyride, { STATUS, ACTIONS, EVENTS } from 'react-joyride';
import { useTour } from '../../context/TourContext';
import { getTourSteps } from '../../config/tourConfig';

const Tour = ({ tourId, autoStart = false, showProgress = true }) => {
    const { activeTour, endTour, startTour, isTourCompleted } = useTour();
    const steps = getTourSteps(tourId);

    // Auto-start tour if specified and not completed
    useEffect(() => {
        if (autoStart && !isTourCompleted(tourId)) {
            // Small delay to allow DOM elements to render
            const timer = setTimeout(() => {
                startTour(tourId);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [autoStart, tourId, startTour, isTourCompleted]);

    const handleJoyrideCallback = (data) => {
        const { status, type, action } = data;

        // Tour finished or skipped
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
            endTour(status === STATUS.FINISHED);
        }

        // Log events for debugging (optional)
        if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
            console.log(`[Tour ${tourId}]`, type, data);
        }
    };

    // Only show tour if it's the active one
    if (activeTour !== tourId) {
        return null;
    }

    return (
        <Joyride
            steps={steps}
            run={true}
            continuous={true}
            showProgress={showProgress}
            showSkipButton={true}
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    arrowColor: '#fff',
                    backgroundColor: '#fff',
                    overlayColor: 'rgba(0, 0, 0, 0.5)',
                    primaryColor: '#10b981',
                    textColor: '#333',
                    width: 380,
                    zIndex: 10000,
                },
                tooltip: {
                    borderRadius: '12px',
                    padding: '20px',
                },
                tooltipContainer: {
                    textAlign: 'left',
                },
                tooltipTitle: {
                    fontSize: '1.125rem', // 18px / 16px base
                    fontWeight: '600',
                    marginBottom: '0.5rem', // 8px / 16px base
                },
                tooltipContent: {
                    fontSize: '0.875rem', // 14px / 16px base
                    lineHeight: '1.5',
                    padding: '0.5rem 0', // 8px / 16px base
                },
                buttonNext: {
                    backgroundColor: '#10b981',
                    borderRadius: '0.5rem', // 8px / 16px base
                    padding: '0.5rem 1rem', // 8px 16px / 16px base
                    fontSize: '0.875rem', // 14px / 16px base
                    fontWeight: '500',
                },
                buttonBack: {
                    color: '#6b7280',
                    marginRight: '8px',
                },
                buttonSkip: {
                    color: '#6b7280',
                },
                buttonClose: {
                    color: '#6b7280',
                },
            }}
            locale={{
                back: 'Back',
                close: 'Close',
                last: 'Finish',
                next: 'Next',
                skip: 'Skip Tour',
            }}
            disableScrolling={false}
            disableScrollParentFix={true}
            spotlightPadding={4}
            scrollToFirstStep={true}
        />
    );
};

export default Tour;
