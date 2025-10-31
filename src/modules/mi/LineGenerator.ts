import { MIOnboardingData } from '../../types';

export class LineGenerator {
  generateGoalLines(data: MIOnboardingData): string[] {
    const goals: string[] = [];
    
    const meaningfulChange = this.formatAsGoal(data.meaningfulChange);
    if (meaningfulChange) {
      goals.push(meaningfulChange);
    }
    
    if (data.perfectFuture) {
      const futureGoal = this.extractGoalFromFuture(data.perfectFuture);
      if (futureGoal && !goals.includes(futureGoal)) {
        goals.push(futureGoal);
      }
    }
    
    return goals.slice(0, 3);
  }

  generateAffirmationLines(data: MIOnboardingData): string[] {
    const affirmations: string[] = [];
    
    affirmations.push("I keep promises to myself.");
    
    if (data.confidenceScore >= 7) {
      affirmations.push("I have what it takes to succeed.");
    } else {
      affirmations.push("I am growing stronger every day.");
    }
    
    if (data.importanceScore >= 8) {
      affirmations.push("This change matters deeply to me.");
    }
    
    if (data.supports.length > 0) {
      affirmations.push("I accept help when I need it.");
    } else {
      affirmations.push("I am resourceful and capable.");
    }
    
    affirmations.push("I make progress even when it's hard.");
    
    return affirmations.slice(0, 5);
  }

  private formatAsGoal(text: string): string {
    let goal = text.trim();
    
    goal = goal.replace(/^I want to |^I will |^I'm going to |^I need to /i, '');
    
    if (!goal.match(/^I /i)) {
      goal = 'I ' + goal;
    }
    
    if (!goal.endsWith('.')) {
      goal += '.';
    }
    
    goal = goal.charAt(0).toUpperCase() + goal.slice(1);
    
    return goal;
  }

  private extractGoalFromFuture(futureText: string): string {
    const sentences = futureText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length === 0) return '';
    
    const firstSentence = sentences[0].trim();
    return this.formatAsGoal(firstSentence);
  }
}

export const lineGenerator = new LineGenerator();
