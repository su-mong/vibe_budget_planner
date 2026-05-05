import { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { useBudget } from '../../hooks/useBudget';
import { supabase } from '../../lib/supabase';
import { Card } from '../shared/Card';

export function GoalSection() {
  const { state, dispatch } = useBudget();
  const { goal, editingGoals } = state;

  const [title, setTitle] = useState(goal.title);
  const [content, setContent] = useState(goal.content);

  // 월 변경 시 goal이 바뀌면 로컬 state 동기화
  useEffect(() => {
    setTitle(goal.title);
    setContent(goal.content);
  }, [goal.title, goal.content]);

  function handleEdit() {
    setTitle(goal.title);
    setContent(goal.content);
    dispatch({ type: 'SET_EDITING_GOALS', editing: true });
  }

  async function handleSave() {
    const { currentMonth } = state;
    const updatedGoal = { ...goal, month: currentMonth, title, content };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const upsertData = goal.id
      ? { id: goal.id, user_id: user.id, month: currentMonth, title, content, order: goal.order }
      : { user_id: user.id, month: currentMonth, title, content, order: 0 };

    const { data, error } = await supabase
      .from('goals')
      .upsert(upsertData)
      .select()
      .single();

    if (!error && data) {
      dispatch({ type: 'SET_GOAL', goal: { ...updatedGoal, id: data.id } });
      dispatch({ type: 'SET_EDITING_GOALS', editing: false });
    }
  }

  return (
    <Card className="border-l-4 border-l-[var(--accent-blue)]">
      {editingGoals ? (
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="목표 제목"
            className="w-full rounded-lg border border-[var(--border-default)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="목표 내용을 입력하세요"
            rows={3}
            className="w-full resize-none rounded-lg border border-[var(--border-default)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              className="cursor-pointer rounded-lg border-0 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'var(--accent-blue)' }}
            >
              확인
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <button
            type="button"
            onClick={handleEdit}
            className="absolute right-0 top-0 cursor-pointer border-0 bg-transparent p-1 text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
          >
            <Pencil size={16} />
          </button>
          {goal.title ? (
            <>
              <h3 className="pr-8 text-lg font-semibold text-[var(--text-primary)]">
                {goal.title}
              </h3>
              {goal.content && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-secondary)]">
                  {goal.content}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-[var(--text-tertiary)]">목표를 입력하세요</p>
          )}
        </div>
      )}
    </Card>
  );
}
