{/* Joint Box Assignment Dialog */}
<Dialog open={jointBoxDialogOpen} onOpenChange={setJointBoxDialogOpen}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Assign Joint Box</DialogTitle>
      <DialogDescription>
        Assign a shared box for {selectedItems.length} selected flutes
      </DialogDescription>
    </DialogHeader>
    
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label>Selected Items</Label>
        <div className="max-h-48 overflow-y-auto border rounded-md p-2 bg-gray-50">
          {selectedItems.map(item => (
            <div key={item.id} className="flex items-center py-1 border-b last:border-0">
              <div className="font-medium">{item.serialNumber}</div>
              <div className="ml-2 text-sm text-gray-500">
                {getTypeFromSpecifications(item)} {getNoteTuningFromSpecifications(item)}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="boxSize">Select Box Size</Label>
        <div className="grid grid-cols-3 gap-2">
          {boxSizes.map(size => (
            <Button
              key={size}
              type="button"
              variant={selectedCustomBox === size ? "default" : "outline"}
              className={selectedCustomBox === size ? "bg-primary text-white" : ""}
              onClick={() => setSelectedCustomBox(size)}
            >
              {size}
            </Button>
          ))}
          <Button
            type="button"
            variant={selectedCustomBox === 'custom' ? "default" : "outline"}
            className={selectedCustomBox === 'custom' ? "bg-primary text-white" : ""}
            onClick={() => setSelectedCustomBox('custom')}
          >
            Custom
          </Button>
        </div>
      </div>
      
      {selectedCustomBox === 'custom' && (
        <div className="space-y-2">
          <Label htmlFor="customBoxSize">Custom Box Size</Label>
          <Input
            id="customBoxSize"
            value={customBoxSize}
            onChange={(e) => setCustomBoxSize(e.target.value)}
            placeholder="e.g. 25x25x25"
          />
        </div>
      )}
    </div>
    
    <DialogFooter>
      <Button
        variant="outline"
        onClick={() => {
          setJointBoxDialogOpen(false);
          setSelectedCustomBox('');
          setCustomBoxSize('');
        }}
      >
        Cancel
      </Button>
      <Button
        disabled={
          selectedItems.length === 0 || 
          (selectedCustomBox === 'custom' && !customBoxSize) ||
          (!selectedCustomBox)
        }
        onClick={() => {
          const boxSize = selectedCustomBox === 'custom' ? customBoxSize : selectedCustomBox;
          updateCustomBoxMutation.mutate({
            itemIds: selectedItems.map(item => item.id),
            customBoxSize: boxSize
          });
          setJointBoxDialogOpen(false);
        }}
        className="bg-[#1F5B61] hover:bg-[#174349] text-white"
      >
        Apply Custom Box
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>