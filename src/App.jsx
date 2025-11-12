import { useState, useEffect } from "react";
import {
  Authenticator,
  Button,
  Text,
  TextField,
  Heading,
  Flex,
  View,
  Image,
  Grid,
  Divider,
} from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import "@aws-amplify/ui-react/styles.css";
import { getUrl } from "aws-amplify/storage";
import { uploadData } from "aws-amplify/storage";
import { generateClient } from "aws-amplify/data";
import outputs from "../amplify_outputs.json";

/**
 * @type {import('aws-amplify/data').Client<import('../amplify/data/resource').Schema>}
 */

Amplify.configure(outputs);
const client = generateClient({
  authMode: "userPool",
});

export default function App() {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const { data: notes } = await client.models.Note.list();
    await Promise.all(
      notes.map(async (note) => {
        if (note.image) {
          const linkToStorageFile = await getUrl({
            path: ({ identityId }) => `media/${identityId}/${note.image}`,
          });
          console.log(linkToStorageFile.url);
          note.image = linkToStorageFile.url;
        }
        return note;
      })
    );
    console.log(notes);
    setNotes(notes);
  }

  async function createNote(event) {
    event.preventDefault();
    // ⛔ Block if there are already 10 notes
    if (notes.length >= 10) {
      alert("You can only create up to 10 notes.");
      return;
    }
    const form = new FormData(event.target);
    console.log(form.get("image").name);

    const { data: newNote } = await client.models.Note.create({
      name: form.get("name"),
      description: form.get("description"),
      image: form.get("image").name,
    });

    console.log(newNote);
    if (newNote.image)
      if (newNote.image)
        await uploadData({
          path: ({ identityId }) => `media/${identityId}/${newNote.image}`,
          data: form.get("image"),
        }).result;

    fetchNotes();
    event.target.reset();
  }

  async function deleteNote({ id }) {
    const toBeDeletedNote = {
      id: id,
    };

    const { data: deletedNote } = await client.models.Note.delete(
      toBeDeletedNote
    );
    console.log(deletedNote);

    fetchNotes();
  }

  return (
    <Authenticator>
      {({ signOut }) => (
        <Flex
          className="App"
          justifyContent="center"
          alignItems="center"
          direction="column"
          width="100%"
          margin="0 auto"
        >
          <Heading level={1}>My Notes App</Heading>

          {/* Formularul de creare note – rămâne fixat, nu scrollabil */}
          <View
            as="form"
            onSubmit={createNote}
            style={{
              textAlign: "center",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}
            margin="3rem 0"
          >
            <Flex
              direction="column"
              justifyContent="center"
              alignItems="center"
              gap="2rem"
              padding="2rem"
              width="100%"
              maxWidth="500px"
              margin="0 auto"
              style={{ textAlign: "center" }}   // 🔥 crucial pe Android
            >
              <TextField
                name="name"
                placeholder="Note name"
                label="Note Name"
                labelHidden
                variation="quiet"
                required
              />

              <TextField
                name="description"
                placeholder="Note description"
                label="Note Description"
                labelHidden
                variation="quiet"
                required
              />

              <View
                name="image"
                as="input"
                type="file"
                style={{
                  width: "100%",
                  maxWidth: "400px",
                }}
                className="file-input"
              />

              <Button type="submit" variation="primary">
                Create Note
              </Button>
            </Flex>
          </View>

          {/* 🔹 Doar secțiunea de Current Notes va avea scroll lateral */}
          <Heading level={2}>Current Notes</Heading>

          <View className="notes-scroll-container" margin="3rem 0">
            {notes.map((note) => (
              <Flex
                key={note.id || note.name}
                direction="column"
                justifyContent="center"
                alignItems="center"
                gap="2rem"
                border="1px solid #ccc"
                padding="2rem"
                borderRadius="5%"
                className="box"
                textAlign="center"
              >
                <View>
                  <Heading level="3">{note.name}</Heading>
                </View>

                <Text fontStyle="italic">{note.description}</Text>

                {note.image && (
                  <Image
                    src={note.image}
                    alt={`visual aid for ${note.name}`}
                    style={{ width: "100%", maxWidth: "400px" }}
                  />
                )}

                <Button
                  variation="destructive"
                  onClick={() => deleteNote(note)}
                >
                  Delete note
                </Button>
              </Flex>
            ))}
          </View>

          <Button onClick={signOut}>Sign Out</Button>
        </Flex>
      )}
    </Authenticator>
  );
}