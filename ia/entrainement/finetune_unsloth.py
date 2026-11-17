"""Fine-tuning (LoRA) du modèle FlowManage — à exécuter sur Google Colab (GPU T4 gratuit).

Étapes :
  1. Colab → Exécution → Modifier le type d'exécution → GPU T4
  2. !pip install unsloth
  3. Envoyer dans Colab : ce script, ../Modelfile et donnees/flowmanage-instructions.jsonl
  4. !python finetune_unsloth.py
  5. Télécharger le fichier flowmanage-gguf/*.gguf, le placer dans ia/entrainement/
  6. Sur le PC : ollama create flowmanage -f entrainement/Modelfile.finetune

L'API d'Unsloth évolue vite : en cas d'erreur, comparer avec les notebooks officiels
« Qwen2.5 conversational » sur https://docs.unsloth.ai
"""

import re
from pathlib import Path

from datasets import load_dataset
from trl import SFTConfig, SFTTrainer
from unsloth import FastLanguageModel
from unsloth.chat_templates import get_chat_template

MODELE_BASE = "unsloth/Qwen2.5-3B-Instruct"  # même famille que FROM qwen2.5:3b dans le Modelfile
DONNEES = "flowmanage-instructions.jsonl"
SORTIE = "flowmanage-gguf"

# Le même message système que dans le Modelfile, pour que l'entraînement et l'usage concordent
modelfile = Path("Modelfile").read_text(encoding="utf-8")
SYSTEME = re.search(r'SYSTEM """(.*?)"""', modelfile, re.S).group(1).strip()

model, tokenizer = FastLanguageModel.from_pretrained(MODELE_BASE, max_seq_length=2048, load_in_4bit=True)
model = FastLanguageModel.get_peft_model(
    model,
    r=16,
    lora_alpha=16,
    lora_dropout=0,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    use_gradient_checkpointing="unsloth",
    random_state=2026,
)
tokenizer = get_chat_template(tokenizer, chat_template="qwen-2.5")

donnees = load_dataset("json", data_files=DONNEES, split="train")


def formater(exemple):
    messages = [{"role": "system", "content": SYSTEME}, *exemple["messages"]]
    return {"text": tokenizer.apply_chat_template(messages, tokenize=False)}


donnees = donnees.map(formater)

trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=donnees,
    args=SFTConfig(
        dataset_text_field="text",
        max_seq_length=2048,
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        num_train_epochs=3,
        learning_rate=2e-4,
        warmup_steps=5,
        logging_steps=5,
        optim="adamw_8bit",
        seed=2026,
        output_dir="sorties",
        report_to="none",
    ),
)
trainer.train()

# Export GGUF quantifié (≈ 2 Go) utilisable par Ollama
model.save_pretrained_gguf(SORTIE, tokenizer, quantization_method="q4_k_m")
print(f"✔ Modèle exporté dans {SORTIE}/ — copier le .gguf dans ia/entrainement/ puis : ollama create flowmanage -f entrainement/Modelfile.finetune")
