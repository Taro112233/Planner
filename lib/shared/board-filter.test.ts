// lib/shared/board-filter.test.ts

import { describe, it, expect } from 'vitest';
import type { BoardDto, BoardTaskDto } from '@/types/planner';
import {
  EMPTY_BOARD_FILTER,
  activeFilterCount,
  applyBoardFilter,
  isBoardViewAltered,
} from './board-filter';

function task(id: string, overrides: Partial<BoardTaskDto> = {}): BoardTaskDto {
  return {
    id,
    groupId: 'g-1',
    title: id,
    status: 'TODO',
    priority: 'MEDIUM',
    position: '1',
    startDate: null,
    dueDate: null,
    subtaskTotal: 0,
    subtaskDone: 0,
    assignees: [],
    badges: [],
    subtasks: [],
    createdAt: '',
    updatedAt: '',
    ...overrides,
  } as BoardTaskDto;
}

const BOARD = {
  organizationId: 'org-1',
  planId: 'p-1',
  groups: [
    {
      id: 'g-1',
      name: 'To Do',
      color: 'slate',
      sortOrder: 0,
      wipLimit: null,
      taskItems: [
        task('b', { priority: 'LOW', dueDate: '2026-10-20T00:00:00Z' }),
        task('a', {
          priority: 'URGENT',
          assignees: [{ organizationUserId: 'ou-1', name: 'Ada', avatarUrl: null }],
        }),
        task('c', { priority: 'HIGH', dueDate: '2026-10-15T00:00:00Z' }),
      ],
    },
  ],
} as unknown as BoardDto;

const ids = (board: BoardDto) => board.groups[0].taskItems.map((t) => t.id);

describe('applyBoardFilter', () => {
  it('returns the board untouched with no filter and manual order', () => {
    expect(applyBoardFilter(BOARD, EMPTY_BOARD_FILTER)).toBe(BOARD);
    expect(isBoardViewAltered(EMPTY_BOARD_FILTER)).toBe(false);
  });

  it('filters by priority and by assignee', () => {
    expect(ids(applyBoardFilter(BOARD, { ...EMPTY_BOARD_FILTER, priorities: ['LOW', 'HIGH'] }))).toEqual([
      'b',
      'c',
    ]);
    expect(ids(applyBoardFilter(BOARD, { ...EMPTY_BOARD_FILTER, assigneeId: 'ou-1' }))).toEqual(['a']);
  });

  it('sorts by due date with undated last, and by priority', () => {
    expect(ids(applyBoardFilter(BOARD, { ...EMPTY_BOARD_FILTER, sort: 'due' }))).toEqual(['c', 'b', 'a']);
    expect(ids(applyBoardFilter(BOARD, { ...EMPTY_BOARD_FILTER, sort: 'priority' }))).toEqual([
      'a',
      'c',
      'b',
    ]);
  });

  it('counts filters separately from the sort', () => {
    expect(activeFilterCount({ priorities: ['LOW'], assigneeId: 'ou-1', sort: 'title' })).toBe(2);
    expect(isBoardViewAltered({ ...EMPTY_BOARD_FILTER, sort: 'title' })).toBe(true);
  });
});
