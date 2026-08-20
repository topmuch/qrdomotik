'use client';

import { useEffect, useState } from 'react';
import { Pill, Check } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MedicationModuleProps {
  content: any;
  slug: string;
}

interface Medication {
  name: string;
  dosage: string;
  time?: string;
}

export function MedicationModule({ content, slug }: MedicationModuleProps) {
  const medications: Medication[] = Array.isArray(content?.medications)
    ? content.medications
    : [];

  const [takenSet, setTakenSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`/api/r/${slug}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionType: 'view' }),
    });
  }, [slug]);

  const markTaken = (med: Medication) => {
    setTakenSet((prev) => {
      const next = new Set(prev);
      next.add(med.name);
      return next;
    });

    fetch(`/api/r/${slug}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actionType: 'medication_taken',
        detailsJson: JSON.stringify({ name: med.name }),
      }),
    });
  };

  return (
    <div className="max-w-md mx-auto">
      <Card className="border-teal-200">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100">
              <Pill className="h-5 w-5 text-teal-600" />
            </div>
            <h2 className="text-xl font-bold text-teal-700">
              Médicaments
            </h2>
          </div>
        </CardHeader>

        <CardContent>
          {content?.reminderMessage && (
            <div className="mb-4 rounded-lg bg-teal-50 border border-teal-200 p-3">
              <p className="text-sm text-teal-700">{content.reminderMessage}</p>
            </div>
          )}

          {medications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun médicament configuré
            </p>
          ) : (
            <div className="space-y-3">
              {medications.map((med, index) => {
                const isTaken = takenSet.has(med.name);
                return (
                  <Card key={index} className="border-teal-100 bg-teal-50/40">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Pill className="h-4 w-4 text-teal-500 shrink-0" />
                            <h3 className="font-semibold text-teal-800 truncate">
                              {med.name}
                            </h3>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <Badge
                              variant="secondary"
                              className="bg-teal-100 text-teal-700"
                            >
                              {med.dosage}
                            </Badge>
                            {med.time && (
                              <Badge
                                variant="outline"
                                className="border-teal-300 text-teal-600"
                              >
                                {med.time}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {isTaken ? (
                          <Button
                            disabled
                            className="bg-green-500 hover:bg-green-500 text-white shrink-0"
                          >
                            <Check className="h-4 w-4 mr-1.5" />
                            Pris !
                          </Button>
                        ) : (
                          <Button
                            onClick={() => markTaken(med)}
                            className="bg-green-600 hover:bg-green-700 text-white shrink-0 text-base px-5 py-5"
                          >
                            Pris aujourd&apos;hui
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
