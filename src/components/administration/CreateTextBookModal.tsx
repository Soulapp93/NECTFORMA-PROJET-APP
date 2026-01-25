import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookText } from 'lucide-react';
import { useFormations } from '@/hooks/useFormations';
import { textBookService } from '@/services/textBookService';
import { useToast } from '@/hooks/use-toast';

interface CreateTextBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateTextBookModal: React.FC<CreateTextBookModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedFormation, setSelectedFormation] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { formations } = useFormations();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFormation) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une formation.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const selectedFormationData = formations.find(f => f.id === selectedFormation);
    const defaultTitle = `Cahier de texte - ${selectedFormationData?.title || 'Formation'}`;
    
    try {
      await textBookService.createTextBook({
        formation_id: selectedFormation,
        title: title || defaultTitle,
      });

      toast({
        title: "Succès",
        description: "Le cahier de texte a été créé avec succès.",
      });

      setSelectedFormation('');
      setTitle('');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du cahier de texte.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFormation('');
    setTitle('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <BookText className="h-4 w-4 text-primary-foreground" />
            </div>
            Créer un Cahier de Texte
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="formation">Formation</Label>
            <Select value={selectedFormation} onValueChange={setSelectedFormation}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une formation" />
              </SelectTrigger>
              <SelectContent>
                {formations.map((formation) => (
                  <SelectItem key={formation.id} value={formation.id}>
                    {formation.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Titre (optionnel)</Label>
            <Input
              id="title"
              type="text"
              placeholder="ex: Cahier de texte 2025-2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTextBookModal;