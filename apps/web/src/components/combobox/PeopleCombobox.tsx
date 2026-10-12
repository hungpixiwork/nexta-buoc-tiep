import React, { useState, useEffect, useRef } from 'react';
import { themeColors } from '@buoc-tiep/shared';
import { Search, Check, AlertCircle } from 'lucide-react';
import { PersonRecord } from '@buoc-tiep/shared';
import { useTranslation } from '../../i18n';

export interface PeopleComboboxProps {
  value?: string; // personId
  onChange: (personId: string | null, selectedPerson?: PersonRecord | null) => void;
  label?: string;
  placeholder?: string;
  requiredRole?: string;
  filterArea?: string;
  allowUnassigned?: boolean;
  allowAssignToMe?: boolean;
  currentUserId?: string;
  currentUserName?: string;
  disabled?: boolean;
}

// Fallback Member Directory when offline or initializing
const DEFAULT_PEOPLE_SSOT: PersonRecord[] = [
  {
    id: 'usr-hung-01',
    publicCode: 'TNV-8842',
    fullName: 'Nguyễn Văn Hùng',
    role: 'volunteer',
    status: 'active',
    capabilities: ['medical_escort', 'field_survey'],
    serviceAreas: ['Hóc Môn', 'Quận 12'],
    maxActiveCases: 5,
    activeCaseCount: 2
  },
  {
    id: 'usr-trang-02',
    publicCode: 'DPV-1022',
    fullName: 'Phạm Thu Trang',
    role: 'coordinator',
    status: 'active',
    capabilities: ['safeguarding_triage', 'referral_coordination'],
    serviceAreas: ['TP. Hồ Chí Minh', 'Hóc Môn'],
    maxActiveCases: 10,
    activeCaseCount: 4
  },
  {
    id: 'usr-minh-03',
    publicCode: 'TNV-3310',
    fullName: 'Lê Hoàng Minh',
    role: 'navigator',
    status: 'active',
    capabilities: ['legal_aid', 'documentation'],
    serviceAreas: ['Quận 1', 'Bình Thạnh'],
    maxActiveCases: 5,
    activeCaseCount: 1
  },
  {
    id: 'usr-lan-04',
    publicCode: 'CB-1110',
    fullName: 'Trần Thị Mai Lan',
    role: 'supervisor',
    status: 'active',
    capabilities: ['child_safeguarding', 'crisis_intervention'],
    serviceAreas: ['TP. Hồ Chí Minh', 'Bình Chánh'],
    maxActiveCases: 8,
    activeCaseCount: 3
  }
];

export const PeopleCombobox: React.FC<PeopleComboboxProps> = ({
  value,
  onChange,
  label,
  placeholder,
  requiredRole,
  filterArea,
  allowUnassigned = true,
  allowAssignToMe = true,
  currentUserId = 'usr-trang-02',
  currentUserName = 'Phạm Thu Trang (Tôi - Điều phối viên)',
  disabled = false
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [peopleList] = useState<PersonRecord[]>(DEFAULT_PEOPLE_SSOT);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayLabel = label ?? t('combobox.assigneeLabel');
  const displayPlaceholder = placeholder ?? t('combobox.searchPlaceholder');

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedPerson = peopleList.find(p => p.id === value);

  // Filter candidates
  const filteredList = peopleList.filter(p => {
    if (requiredRole && p.role !== requiredRole && !(requiredRole === 'volunteer' && p.role === 'navigator')) {
      return false;
    }
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(q) ||
      p.publicCode.toLowerCase().includes(q) ||
      p.serviceAreas?.some(a => a.toLowerCase().includes(q)) ||
      p.capabilities?.some(c => c.toLowerCase().includes(q))
    );
  });

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'volunteer': return t('volunteersTab.totalVolunteers');
      case 'navigator': return t('volunteersTab.activeNavigators');
      case 'coordinator': return t('header.adminConsole');
      case 'supervisor': return 'Cán bộ Giám sát';
      default: return 'Thành viên';
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', marginBottom: '14px' }}>
      {displayLabel && (
        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy, marginBottom: '5px' }}>
          {displayLabel}
        </label>
      )}

      {/* Main Selected Input / Trigger */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          backgroundColor: disabled ? '#F1F5F9' : '#FFFFFF',
          border: isOpen ? `2px solid ${themeColors.primaryNavy}` : '1.5px solid #CBD5E1',
          borderRadius: '6px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          minHeight: '42px',
          boxSizing: 'border-box'
        }}
      >
        {selectedPerson ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: '#E0F2FE',
                color: '#0369A1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '11px',
                flexShrink: 0
              }}
            >
              {selectedPerson.fullName.charAt(0)}
            </div>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span style={{ fontWeight: '700', fontSize: '13px', color: themeColors.primaryNavy }}>
                {selectedPerson.fullName}
              </span>
              <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '6px' }}>
                · {getRoleLabel(selectedPerson.role)} ({selectedPerson.publicCode})
              </span>
            </div>
          </div>
        ) : (
          <span style={{ fontSize: '13px', color: '#94A3B8' }}>
            {displayPlaceholder}
          </span>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {selectedPerson && (
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: '700',
                padding: '2px 6px',
                borderRadius: '10px',
                backgroundColor: selectedPerson.activeCaseCount >= selectedPerson.maxActiveCases ? '#FEE2E2' : '#DCFCE7',
                color: selectedPerson.activeCaseCount >= selectedPerson.maxActiveCases ? '#991B1B' : '#166534'
              }}
            >
              {selectedPerson.activeCaseCount} ca
            </span>
          )}
          <Search size={15} color="#64748B" />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 1200,
            backgroundColor: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
            maxHeight: '280px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Search Box Header */}
          <div style={{ padding: '8px', borderBottom: '1px solid #F1F5F9', position: 'sticky', top: 0, backgroundColor: '#FFFFFF', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <Search size={14} color="#64748B" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('combobox.searchPlaceholder')}
                autoFocus
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent',
                  fontSize: '12.5px',
                  color: '#0F172A'
                }}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ padding: '4px 8px', borderBottom: '1px solid #F1F5F9', display: 'flex', gap: '6px' }}>
            {allowAssignToMe && (
              <button
                type="button"
                onClick={() => {
                  const me = peopleList.find(p => p.id === currentUserId) || {
                    id: currentUserId,
                    publicCode: 'DPV-ME',
                    fullName: currentUserName,
                    role: 'coordinator',
                    status: 'active',
                    capabilities: [],
                    serviceAreas: ['TP.HCM'],
                    maxActiveCases: 10,
                    activeCaseCount: 2
                  };
                  onChange(me.id, me as any);
                  setIsOpen(false);
                }}
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#0369A1',
                  backgroundColor: '#E0F2FE',
                  border: '1px solid #BAE6FD',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                {t('combobox.assignToMe')}
              </button>
            )}

            {allowUnassigned && (
              <button
                type="button"
                onClick={() => {
                  onChange(null, null);
                  setIsOpen(false);
                }}
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#475569',
                  backgroundColor: '#F1F5F9',
                  border: '1px solid #E2E8F0',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                {t('combobox.unassignedQueue')}
              </button>
            )}
          </div>

          {/* Candidates List */}
          <div style={{ padding: '4px 0' }}>
            {filteredList.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#64748B', fontSize: '12px' }}>
                <AlertCircle size={18} color="#94A3B8" style={{ margin: '0 auto 4px auto' }} />
                {t('combobox.noMatch')}
              </div>
            ) : (
              filteredList.map(person => {
                const isSelected = value === person.id;
                const isAreaMatch = filterArea && person.serviceAreas?.some(a => filterArea.toLowerCase().includes(a.toLowerCase()));

                return (
                  <div
                    key={person.id}
                    onClick={() => {
                      onChange(person.id, person);
                      setIsOpen(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#EFF6FF' : 'transparent',
                      borderBottom: '1px solid #F8FAFC',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = isSelected ? '#EFF6FF' : '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = isSelected ? '#EFF6FF' : 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: '#E0F2FE',
                          color: '#0369A1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '800',
                          fontSize: '11px',
                          flexShrink: 0
                        }}
                      >
                        {person.fullName.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '12.5px', color: themeColors.primaryNavy }}>
                          {person.fullName}
                          {isAreaMatch && (
                            <span style={{ marginLeft: '6px', fontSize: '10px', backgroundColor: '#FEF3C7', color: '#92400E', padding: '1px 5px', borderRadius: '4px', fontWeight: '700' }}>
                              Đúng địa bàn
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>
                          {getRoleLabel(person.role)} · {person.serviceAreas?.join(', ') || 'TP.HCM'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: '700',
                          color: person.activeCaseCount >= person.maxActiveCases ? '#DC2626' : '#16A34A'
                        }}
                      >
                        {person.activeCaseCount} ca
                      </span>
                      {isSelected && <Check size={16} color="#0B4F9C" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

