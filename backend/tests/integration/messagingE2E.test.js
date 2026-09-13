/**
 * AURA — End-to-End Multi-Channel Messaging Integration Tests
 *
 * Validates the core AURA differentiator:
 * ONE HUMAN GOAL -> CONTACT RESOLUTION -> MULTI-CHANNEL PLANNING ->
 * POLICY CHECK -> APPROVAL -> EXECUTION -> VERIFICATION -> AUDIT
 */

const { executeTask } = require('../../src/integration/agentAdapter');
const { policyEngine } = require('../../../agent/src/policy/policyEngine');
const contactService = require('../../src/services/contactService');
const { defaultChannelRegistry } = require('../../../agent/src/channels/channelRegistry');

describe('AURA Multi-Channel Messaging End-to-End Flow', () => {
  const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

  it('1. Resolves natural language name "Abishek" to verified multi-channel identities', async () => {
    const resolution = await contactService.resolveContact(TEST_USER_ID, 'Abishek');
    expect(resolution.confidence).toBe('EXACT');
    expect(resolution.resolvedContact.displayName).toBe('Abishek');
    expect(resolution.availableChannels.whatsapp.destination).toBe('+919042629740');
    expect(resolution.availableChannels.email.destination).toBe('abi323728@gmail.com');
    expect(resolution.availableChannels.sms.destination).toBe('+919042629740');
  });

  it('2. Halts safely without guessing when contact name is ambiguous', async () => {
    // Add second contact with matching name to test ambiguity safety
    await contactService.createContact(TEST_USER_ID, {
      displayName: 'Abishek',
      aliases: ['abi-secondary'],
    });

    const resolution = await contactService.resolveContact(TEST_USER_ID, 'Abishek');
    expect(resolution.confidence).toBe('AMBIGUOUS');
    expect(resolution.resolvedContact).toBeNull();
    expect(resolution.matches.length).toBeGreaterThanOrEqual(2);
  });

  it('3. Enforces deterministic Policy Engine on send_message (requires human approval)', () => {
    const step = {
      tool: 'send_message',
      params: {
        recipientName: 'Abishek',
        channel: 'whatsapp',
        destination: '+919042629740',
        message: 'Work is done.',
      },
    };

    const decision = policyEngine.evaluateStep(step);
    expect(decision.allowed).toBe(true);
    expect(decision.requiresApproval).toBe(true);
    expect(decision.riskLevel).toBe('HIGH');
  });

  it('4. Successfully executes multi-channel message dispatch upon approval', async () => {
    let approvalRequested = false;

    const mockApprovalCallback = async (approvalRequest) => {
      approvalRequested = true;
      expect(approvalRequest.tool).toBe('send_message');
      expect(approvalRequest.riskLevel).toBe('HIGH');
      // User grants approval
      return { decision: 'APPROVED', reason: 'Human user verified recipient and message' };
    };

    const taskResult = await executeTask(
      {
        taskId: 'e2e-task-messaging-001',
        goal: 'Message Abishek on WhatsApp: Work is done.',
        userId: TEST_USER_ID,
        maxSteps: 5,
      },
      mockApprovalCallback
    );

    expect(approvalRequested).toBe(true);
    expect(taskResult.status).toBe('COMPLETED');
    expect(taskResult.plan.steps.length).toBeGreaterThanOrEqual(2);

    // Verify step 0 resolved contact
    const resolveStep = taskResult.plan.steps[0];
    expect(resolveStep.tool).toBe('contact_resolve');
    expect(resolveStep.status).toBe('COMPLETED');

    // Verify step 1 sent message
    const sendStep = taskResult.plan.steps[1];
    expect(sendStep.tool).toBe('send_message');
    expect(sendStep.status).toBe('COMPLETED');
    expect(sendStep.result.status).toBe('ACCEPTED');
  });
});
